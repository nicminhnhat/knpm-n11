require("dotenv").config();

const prisma = require("../lib/prisma");
const { hashPassword } = require("../lib/auth");

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@knpm.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123456";
  const adminName = process.env.ADMIN_NAME || "Quan tri vien";
  const passwordHash = await hashPassword(adminPassword);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      fullName: adminName,
      role: "ADMIN",
      passwordHash,
      status: "ACTIVE",
      lockReason: null,
      verificationStatus: "VERIFIED"
    },
    create: {
      email: adminEmail,
      fullName: adminName,
      role: "ADMIN",
      passwordHash,
      status: "ACTIVE",
      verificationStatus: "VERIFIED"
    }
  });

  console.log("Admin seed completed");
  console.log(`Admin: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error("Admin seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
