require("dotenv").config();

const prisma = require("../lib/prisma");
const { hashPassword } = require("../lib/auth");

async function upsertUser({ email, fullName, role, phone, verificationStatus = "VERIFIED" }) {
  const passwordHash = await hashPassword(process.env.SEED_PASSWORD || "123456");
  return prisma.user.upsert({
    where: { email },
    update: { fullName, role, phone, passwordHash, status: "ACTIVE", lockReason: null, verificationStatus },
    create: { email, fullName, role, phone, passwordHash, status: "ACTIVE", verificationStatus }
  });
}

async function createRoomAndPost(landlord, roomData, postData) {
  const room = await prisma.room.create({
    data: {
      landlordId: landlord.id,
      ...roomData,
      images: { create: roomData.images || [] }
    }
  });

  const post = await prisma.post.create({
    data: {
      landlordId: landlord.id,
      roomId: room.id,
      status: "APPROVED",
      publishedAt: new Date(),
      ...postData
    }
  });

  return { room, post };
}

async function main() {
  const admin = await upsertUser({ email: process.env.ADMIN_EMAIL || "admin@example.com", fullName: process.env.ADMIN_NAME || "System Admin", role: "ADMIN" });
  const student = await upsertUser({ email: process.env.SEED_STUDENT_EMAIL || "student@knpm.local", fullName: "Sinh viên demo", role: "STUDENT", phone: "0900000001" });
  const landlord = await upsertUser({ email: process.env.SEED_LANDLORD_EMAIL || "landlord@knpm.local", fullName: "Chủ trọ demo", role: "LANDLORD", phone: "0900000002", verificationStatus: "VERIFIED" });

  await prisma.messageThread.deleteMany({ where: { OR: [{ studentId: student.id }, { landlordId: landlord.id }] } });
  await prisma.report.deleteMany({ where: { reporterId: student.id } });
  await prisma.favorite.deleteMany({ where: { userId: student.id } });
  await prisma.review.deleteMany({ where: { studentId: student.id } });
  await prisma.notification.deleteMany({ where: { userId: { in: [admin.id, student.id, landlord.id] } } });
  await prisma.verificationProfile.deleteMany({ where: { landlordId: landlord.id } });
  await prisma.post.deleteMany({ where: { landlordId: landlord.id } });
  await prisma.room.deleteMany({ where: { landlordId: landlord.id } });

  await prisma.verificationProfile.create({
    data: {
      landlordId: landlord.id,
      fullName: landlord.fullName,
      phone: landlord.phone,
      address: "77 Nguyễn Huệ, TP Huế",
      documentType: "CCCD",
      documentNumber: "012345678901",
      documentUrl: "https://example.com/cccd-demo.jpg",
      status: "VERIFIED",
      reviewedAt: new Date()
    }
  });

  const samples = [
    {
      room: {
        title: "Phòng trọ gần Đại học Khoa học Huế",
        description: "Phòng sạch sẽ, an ninh, có wifi, chỗ để xe, phù hợp sinh viên.",
        address: "77 Nguyễn Huệ, TP Huế",
        district: "TP Huế",
        city: "Huế",
        price: 1500000,
        area: 22,
        type: "SINGLE",
        status: "AVAILABLE",
        amenities: ["wifi", "parking", "private-bathroom"],
        contactName: landlord.fullName,
        contactPhone: landlord.phone,
        images: [{ url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80", alt: "Phòng trọ demo", sortOrder: 0 }]
      },
      post: { title: "Cho thuê phòng trọ gần trường, giá sinh viên", description: "Phòng trọ gần trung tâm, thuận tiện đi học, có đầy đủ tiện ích cơ bản." }
    },
    {
      room: {
        title: "Phòng có gác lửng khu Bến Ngự",
        description: "Phòng thoáng, có gác lửng, khu dân cư yên tĩnh, giờ giấc tự do.",
        address: "12 Bến Ngự, TP Huế",
        district: "Bến Ngự",
        city: "Huế",
        price: 2100000,
        area: 28,
        type: "APARTMENT",
        status: "AVAILABLE",
        amenities: ["wifi", "parking", "furniture", "no-owner"],
        contactName: landlord.fullName,
        contactPhone: landlord.phone,
        images: [{ url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80", alt: "Phòng có gác", sortOrder: 0 }]
      },
      post: { title: "Phòng gác lửng Bến Ngự, giờ giấc tự do", description: "Phòng có nội thất cơ bản, phù hợp 1-2 sinh viên, gần trung tâm." }
    },
    {
      room: {
        title: "Phòng ở ghép gần Đại học Sư phạm",
        description: "Phòng ở ghép tiết kiệm chi phí, có wifi, bếp chung và chỗ để xe.",
        address: "5 Lê Lợi, TP Huế",
        district: "Lê Lợi",
        city: "Huế",
        price: 900000,
        area: 18,
        type: "SHARED",
        status: "AVAILABLE",
        amenities: ["wifi", "parking"],
        contactName: landlord.fullName,
        contactPhone: landlord.phone,
        images: [{ url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80", alt: "Phòng ở ghép", sortOrder: 0 }]
      },
      post: { title: "Tìm sinh viên ở ghép gần Đại học Sư phạm", description: "Chi phí thấp, khu vực an toàn, dễ đi học và sinh hoạt." }
    }
  ];

  const created = [];
  for (const sample of samples) created.push(await createRoomAndPost(landlord, sample.room, sample.post));

  await prisma.favorite.create({ data: { userId: student.id, roomId: created[0].room.id } });
  await prisma.review.create({ data: { studentId: student.id, roomId: created[0].room.id, rating: 5, content: "Phòng sạch, gần trường, chủ trọ phản hồi nhanh." } });
  await prisma.messageThread.create({
    data: {
      studentId: student.id,
      landlordId: landlord.id,
      postId: created[0].post.id,
      roomId: created[0].room.id,
      messages: { create: [{ senderId: student.id, content: "Em muốn hỏi lịch xem phòng ạ." }, { senderId: landlord.id, content: "Em có thể ghé xem chiều nay nhé." }] }
    }
  });
  await prisma.notification.createMany({
    data: [
      { userId: landlord.id, type: "POST_APPROVED", title: "Bài đăng demo đã được duyệt", content: "Dữ liệu mẫu đã sẵn sàng để kiểm thử." },
      { userId: student.id, type: "SYSTEM", title: "Chào mừng sinh viên demo", content: "Bạn có thể tìm phòng, lưu yêu thích, nhắn tin và báo cáo bài đăng." }
    ]
  });

  console.log("Seed completed");
  console.log(`Admin: ${admin.email}`);
  console.log(`Student: ${student.email}`);
  console.log(`Landlord: ${landlord.email}`);
  console.log(`Password: ${process.env.SEED_PASSWORD || "123456"}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
