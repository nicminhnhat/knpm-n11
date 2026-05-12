const { PrismaClient } = require("@prisma/client");

const globalForPrisma = globalThis;
function isClosedConnectionError(error) {
  const text = String(error?.message || error || "").toLowerCase();
  return text.includes("kind: closed") || text.includes("connection") || text.includes("can't reach database server");
}

async function withPrismaRetry(task, options = {}, client) {
  const retries = Number(options.retries ?? 2);
  const retryDelayMs = Number(options.retryDelayMs ?? 500);
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (!isClosedConnectionError(error) || attempt >= retries) break;
      if (client) await client.$disconnect().catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (attempt + 1)));
      if (client) await client.$connect().catch(() => {});
    }
  }

  throw lastError;
}

const basePrisma = globalForPrisma.basePrisma || new PrismaClient({ log: ["warn"] });
const prisma = globalForPrisma.prisma || basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        return withPrismaRetry(() => query(args), { retries: 2, retryDelayMs: 500 }, basePrisma);
      }
    }
  }
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.basePrisma = basePrisma;
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
module.exports.prisma = prisma;
module.exports.withPrismaRetry = (task, options = {}) => withPrismaRetry(task, options, basePrisma);
