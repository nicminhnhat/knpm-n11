require("dotenv").config();

const prisma = require("../lib/prisma");
const { hashPassword } = require("../lib/auth");

async function upsertUser({ email, fullName, role, phone, verificationStatus = "VERIFIED", password }) {
  const passwordHash = await hashPassword(password || process.env.SEED_PASSWORD || "123456");
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
  const adminEmail = process.env.ADMIN_EMAIL || "admin@knpm.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123456";
  const adminName = process.env.ADMIN_NAME || "Quan tri vien";

  const admin = await upsertUser({ email: adminEmail, fullName: adminName, role: "ADMIN", password: adminPassword });
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

  const imagePool = [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=1200&q=80"
  ];

  const imagesFor = (title, offset) => [0, 1, 2].map((step) => ({
    url: imagePool[(offset + step) % imagePool.length],
    alt: `${title} - ảnh ${step + 1}`,
    sortOrder: step
  }));

  const sampleDate = (hoursAgo) => new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

  const sampleDefinitions = [
    {
      title: "Phòng trọ gần Đại học Khoa học Huế",
      postTitle: "Cho thuê phòng trọ gần trường, giá sinh viên",
      description: "Phòng sạch sẽ, an ninh, có wifi, chỗ để xe, phù hợp sinh viên.",
      postDescription: "Phòng trọ gần trung tâm, thuận tiện đi học, có đầy đủ tiện ích cơ bản.",
      address: "77 Nguyễn Huệ, TP Huế",
      district: "Nguyễn Huệ",
      price: 1500000,
      area: 22,
      type: "SINGLE",
      deposit: 1000000,
      electricityPrice: 3500,
      waterPrice: 70000,
      amenities: ["wifi", "parking", "private-bathroom"],
      hoursAgo: 2
    },
    {
      title: "Phòng có gác lửng khu Bến Ngự",
      postTitle: "Phòng gác lửng Bến Ngự, giờ giấc tự do",
      description: "Phòng thoáng, có gác lửng, khu dân cư yên tĩnh, giờ giấc tự do.",
      postDescription: "Phòng có nội thất cơ bản, phù hợp 1-2 sinh viên, gần trung tâm.",
      address: "12 Bến Ngự, TP Huế",
      district: "Bến Ngự",
      price: 2100000,
      area: 28,
      type: "APARTMENT",
      deposit: 1500000,
      electricityPrice: 3800,
      waterPrice: 80000,
      amenities: ["wifi", "parking", "furniture", "no-owner"],
      hoursAgo: 5
    },
    {
      title: "Phòng ở ghép gần Đại học Sư phạm",
      postTitle: "Tìm sinh viên ở ghép gần Đại học Sư phạm",
      description: "Phòng ở ghép tiết kiệm chi phí, có wifi, bếp chung và chỗ để xe.",
      postDescription: "Chi phí thấp, khu vực an toàn, dễ đi học và sinh hoạt.",
      address: "5 Lê Lợi, TP Huế",
      district: "Lê Lợi",
      price: 900000,
      area: 18,
      type: "SHARED",
      deposit: 500000,
      electricityPrice: 3500,
      waterPrice: 60000,
      amenities: ["wifi", "parking"],
      hoursAgo: 9
    },
    {
      title: "Phòng khép kín gần Cao đẳng Công nghiệp",
      postTitle: "Phòng khép kín đầy đủ tiện nghi gần trường",
      description: "Phòng có vệ sinh riêng, cửa sổ thoáng, phù hợp sinh viên muốn không gian riêng tư.",
      postDescription: "Vị trí thuận tiện, dễ di chuyển đến các trường và khu ăn uống sinh viên.",
      address: "34 Nguyễn Huệ, TP Huế",
      district: "Nguyễn Huệ",
      price: 1700000,
      area: 24,
      type: "SINGLE",
      deposit: 1000000,
      electricityPrice: 3600,
      waterPrice: 70000,
      amenities: ["wifi", "private-bathroom", "security"],
      hoursAgo: 14
    },
    {
      title: "Căn hộ mini gần Vincom Huế",
      postTitle: "Căn hộ mini sáng đẹp, gần trung tâm",
      description: "Căn hộ mini có bếp nhỏ, tủ lạnh, máy lạnh và khu để xe riêng.",
      postDescription: "Phù hợp sinh viên hoặc người đi làm muốn ở lâu dài tại khu trung tâm.",
      address: "18 Hùng Vương, TP Huế",
      district: "Hùng Vương",
      price: 3200000,
      area: 36,
      type: "APARTMENT",
      deposit: 3000000,
      electricityPrice: 4000,
      waterPrice: 90000,
      amenities: ["wifi", "air-conditioner", "furniture", "parking"],
      hoursAgo: 23
    },
    {
      title: "Studio yên tĩnh khu An Cựu",
      postTitle: "Studio yên tĩnh phù hợp học tập dài hạn",
      description: "Studio sáng, yên tĩnh, gần chợ và bến xe buýt, phù hợp người cần tập trung học tập.",
      postDescription: "Không gian riêng, giờ giấc thoải mái, chủ trọ hỗ trợ nhanh khi cần.",
      address: "9 An Dương Vương, TP Huế",
      district: "An Cựu",
      price: 2500000,
      area: 30,
      type: "APARTMENT",
      deposit: 2000000,
      electricityPrice: 3800,
      waterPrice: 80000,
      amenities: ["wifi", "no-owner", "parking"],
      hoursAgo: 30
    },
    {
      title: "Phòng giá mềm gần Đại học Nông Lâm",
      postTitle: "Phòng giá mềm, khu sinh viên Nông Lâm",
      description: "Phòng cơ bản, sạch sẽ, chi phí phù hợp sinh viên năm nhất.",
      postDescription: "Gần trường, gần quán ăn và tiệm giặt, tiết kiệm chi phí sinh hoạt.",
      address: "102 Phùng Hưng, TP Huế",
      district: "Phùng Hưng",
      price: 1100000,
      area: 19,
      type: "SINGLE",
      deposit: 700000,
      electricityPrice: 3500,
      waterPrice: 60000,
      amenities: ["wifi", "parking"],
      hoursAgo: 36
    },
    {
      title: "Phòng đôi gần khu Tây Lộc",
      postTitle: "Phòng đôi rộng rãi, phù hợp hai sinh viên",
      description: "Phòng diện tích rộng, có ban công nhỏ, khu dân cư an ninh.",
      postDescription: "Có thể ở 2 người, chi phí chia sẻ hợp lý, gần nhiều tuyến đường chính.",
      address: "21 Tây Lộc, TP Huế",
      district: "Tây Lộc",
      price: 1900000,
      area: 27,
      type: "SHARED",
      deposit: 1200000,
      electricityPrice: 3600,
      waterPrice: 70000,
      amenities: ["wifi", "parking", "security"],
      hoursAgo: 48
    },
    {
      title: "Ký túc xá mini gần ga Huế",
      postTitle: "Giường ở ghép sạch sẽ gần ga Huế",
      description: "Không gian ở ghép được chia khu rõ ràng, phù hợp sinh viên cần chi phí thấp.",
      postDescription: "Có tủ đồ cá nhân, khu sinh hoạt chung và wifi ổn định.",
      address: "66 Bùi Thị Xuân, TP Huế",
      district: "Bùi Thị Xuân",
      price: 750000,
      area: 16,
      type: "DORM",
      deposit: 500000,
      electricityPrice: 3500,
      waterPrice: 50000,
      amenities: ["wifi", "parking", "security"],
      hoursAgo: 60
    },
    {
      title: "Phòng mới sửa gần Đại học Y Dược",
      postTitle: "Phòng mới sửa, sáng thoáng gần Đại học Y Dược",
      description: "Phòng mới sơn sửa, cửa sổ lớn, có chỗ phơi đồ và khu để xe.",
      postDescription: "Phù hợp sinh viên Y Dược muốn ở gần trường, đi bộ hoặc đi xe vài phút.",
      address: "41 Ngô Quyền, TP Huế",
      district: "Ngô Quyền",
      price: 2200000,
      area: 26,
      type: "SINGLE",
      deposit: 1500000,
      electricityPrice: 3800,
      waterPrice: 80000,
      amenities: ["wifi", "private-bathroom", "parking", "security"],
      hoursAgo: 72
    }
  ];

  const samples = sampleDefinitions.map((item, index) => {
    const createdAt = sampleDate(item.hoursAgo);
    return {
      room: {
        title: item.title,
        description: item.description,
        address: item.address,
        district: item.district,
        city: "Huế",
        price: item.price,
        area: item.area,
        type: item.type,
        status: "AVAILABLE",
        amenities: item.amenities,
        deposit: item.deposit,
        electricityPrice: item.electricityPrice,
        waterPrice: item.waterPrice,
        contactName: landlord.fullName,
        contactPhone: landlord.phone,
        images: imagesFor(item.title, index)
      },
      post: {
        title: item.postTitle,
        description: item.postDescription,
        createdAt,
        publishedAt: createdAt
      }
    };
  });
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
      { userId: landlord.id, type: "POST_APPROVED", title: "Bài đăng demo đã được duyệt", content: "Các phòng mẫu đã sẵn sàng để bạn kiểm tra giao diện đăng tin." },
      { userId: student.id, type: "SYSTEM", title: "Chào mừng sinh viên demo", content: "Bạn có thể tìm phòng, nhắn tin với chủ trọ và báo cáo bài đăng chưa phù hợp." }
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
