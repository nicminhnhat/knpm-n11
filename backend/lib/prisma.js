const { PrismaClient } = require("@prisma/client");

const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma || new PrismaClient({ log: ["warn", "error"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

function isClosedConnectionError(error) {
  const text = String(error?.message || error || "").toLowerCase();
  return text.includes("kind: closed") || text.includes("connection") || text.includes("can't reach database server");
}

async function withPrismaRetry(task, options = {}) {
  const retries = Number(options.retries ?? 2);
  const retryDelayMs = Number(options.retryDelayMs ?? 500);
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (!isClosedConnectionError(error) || attempt >= retries) break;
      await prisma.$disconnect().catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (attempt + 1)));
      await prisma.$connect().catch(() => {});
    }
  }

  throw lastError;
}

module.exports = prisma;
module.exports.prisma = prisma;
module.exports.withPrismaRetry = withPrismaRetry;
