require("dotenv").config();

const prisma = require("../lib/prisma");
const { hashPassword } = require("../lib/auth");

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@knpm.local";
  const password = process.env.ADMIN_PASSWORD || "Admin123456";
  const fullName = process.env.ADMIN_NAME || "Quan tri vien";

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      fullName,
      passwordHash: await hashPassword(password),
      role: "ADMIN",
      status: "ACTIVE",
      verificationStatus: "VERIFIED"
    },
    create: {
      email,
      fullName,
      passwordHash: await hashPassword(password),
      role: "ADMIN",
      status: "ACTIVE",
      verificationStatus: "VERIFIED"
    }
  });

  console.log(`Admin ready: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error("Seed admin failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
