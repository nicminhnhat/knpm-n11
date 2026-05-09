require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { put } = require("@vercel/blob");
const prisma = require("./lib/prisma");
const { comparePassword, hashPassword, signToken, toPublicUser } = require("./lib/auth");
const { authenticateToken, authorizeRoles, requireVerifiedLandlord } = require("./lib/auth-middleware");

const app = express();
const resetOtps = new Map();
const isVercel = Boolean(process.env.VERCEL);
const hasBlobStorage = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const maxUploadSize = isVercel ? 4 * 1024 * 1024 : 5 * 1024 * 1024;
const uploadDir = path.join(__dirname, "uploads");
const storage = (isVercel || hasBlobStorage)
  ? multer.memoryStorage()
  : multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
  });

if (!hasBlobStorage && !isVercel) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({
  storage,
  limits: { fileSize: maxUploadSize },
  fileFilter(req, file, cb) {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) return cb(new Error("Chỉ hỗ trợ tải lên tệp hình ảnh."));
    cb(null, true);
  }
});

const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Cho phép Postman/curl hoặc khi chưa cấu hình FRONTEND_URL ở local.
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: "5mb" }));
if (!isVercel && !hasBlobStorage) {
  app.use("/uploads", express.static(uploadDir));
}

const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const ok = (res, data = {}, status = 200) => res.status(status).json({ success: true, ...data });
const fail = (res, status, message, extra = {}) => res.status(status).json({ success: false, message, ...extra });
const clean = (v) => (typeof v === "string" ? v.trim() : "");
const opt = (v) => clean(v) || null;
const emailOf = (v) => clean(v).toLowerCase();
const isEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const num = (v, fallback = undefined) => {
  if (v === undefined || v === null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const intNum = (v, fallback = undefined) => {
  if (v === undefined || v === null || v === "") return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};
const pageInfo = (query) => {
  const page = Math.max(intNum(query.page, 1), 1);
  const limit = Math.min(Math.max(intNum(query.limit, 12), 1), 50);
  return { page, limit, skip: (page - 1) * limit, take: limit };
};
const amenitiesOf = (v) => {
  if (Array.isArray(v)) return v.map(clean).filter(Boolean);
  if (typeof v === "string") return v.split(",").map(clean).filter(Boolean);
  return [];
};
const userSelect = {
  id: true,
  email: true,
  phone: true,
  fullName: true,
  role: true,
  status: true,
  lockReason: true,
  avatarUrl: true,
  verificationStatus: true,
  createdAt: true,
  updatedAt: true
};
const roomInclude = {
  images: { orderBy: { sortOrder: "asc" } },
  landlord: { select: userSelect },
  posts: { where: { status: "APPROVED" }, orderBy: { publishedAt: "desc" }, take: 1 },
  _count: { select: { favorites: true, reviews: true } }
};
const postInclude = {
  room: { include: { images: { orderBy: { sortOrder: "asc" } } } },
  landlord: { select: userSelect },
  _count: { select: { reports: true, threads: true } }
};

function validatePassword(password) {
  return typeof password === "string" && password.length >= 6;
}

function publicRoomWhere(query) {
  const q = clean(query.q || query.keyword || query.search);
  const minPrice = num(query.minPrice);
  const maxPrice = num(query.maxPrice);
  const minArea = num(query.minArea);
  const maxArea = num(query.maxArea);
  const type = clean(query.type || query.loaiPhong).toUpperCase();
  const district = clean(query.district || query.khuVuc);
  const amenities = amenitiesOf(query.amenities || query.tienIch);
  const and = [{ status: "AVAILABLE" }, { posts: { some: { status: "APPROVED" } } }];

  if (q) {
    and.push({ OR: [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
      { district: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } }
    ] });
  }
  if (minPrice !== undefined || maxPrice !== undefined) and.push({ price: { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) } });
  if (minArea !== undefined || maxArea !== undefined) and.push({ area: { ...(minArea !== undefined ? { gte: minArea } : {}), ...(maxArea !== undefined ? { lte: maxArea } : {}) } });
  if (district) and.push({ district: { contains: district, mode: "insensitive" } });
  if (["SINGLE", "SHARED", "DORM", "APARTMENT", "OTHER"].includes(type)) and.push({ type });
  for (const amenity of amenities) and.push({ amenities: { has: amenity } });
  return { AND: and };
}

function roomData(body, current = {}) {
  return {
    title: clean(body.title || body.tieuDe || current.title),
    description: clean(body.description || body.moTaPhongTro || body.moTa || current.description),
    address: clean(body.address || body.diaChi || current.address),
    ward: body.ward === undefined ? current.ward : opt(body.ward),
    district: body.district === undefined && body.khuVuc === undefined ? current.district : opt(body.district || body.khuVuc),
    city: clean(body.city || current.city || "Huế"),
    price: num(body.price ?? body.giaPhongTro, current.price),
    area: num(body.area ?? body.dienTich, current.area),
    type: clean(body.type || body.loaiPhong || current.type || "SINGLE").toUpperCase(),
    status: clean(body.status || body.trangThai || current.status || "AVAILABLE").toUpperCase(),
    maxOccupants: intNum(body.maxOccupants, current.maxOccupants),
    electricityPrice: num(body.electricityPrice, current.electricityPrice),
    waterPrice: num(body.waterPrice, current.waterPrice),
    internetPrice: num(body.internetPrice, current.internetPrice),
    deposit: num(body.deposit, current.deposit),
    latitude: num(body.latitude, current.latitude),
    longitude: num(body.longitude, current.longitude),
    amenities: body.amenities === undefined && body.tienIch === undefined ? current.amenities || [] : amenitiesOf(body.amenities || body.tienIch),
    contactName: body.contactName === undefined ? current.contactName : opt(body.contactName),
    contactPhone: body.contactPhone === undefined && body.soDTLienHe === undefined ? current.contactPhone : opt(body.contactPhone || body.soDTLienHe)
  };
}

function validateRoom(data) {
  if (!data.title || !data.description || !data.address) return "Thiếu tiêu đề, mô tả hoặc địa chỉ phòng trọ.";
  if (!Number.isFinite(Number(data.price)) || Number(data.price) <= 0) return "Giá phòng phải lớn hơn 0.";
  if (!Number.isFinite(Number(data.area)) || Number(data.area) <= 0) return "Diện tích phòng phải lớn hơn 0.";
  if (!["SINGLE", "SHARED", "DORM", "APARTMENT", "OTHER"].includes(data.type)) return "Loại phòng không hợp lệ.";
  if (!["AVAILABLE", "RENTED", "HIDDEN"].includes(data.status)) return "Trạng thái phòng không hợp lệ.";
  return null;
}

app.get("/", (req, res) => ok(res, { message: "KNPM N11 backend is running", docs: "/api/health" }));
app.get("/api/health", (req, res) => ok(res, { message: "API is healthy", timestamp: new Date().toISOString() }));
app.post("/api/uploads", authenticateToken, upload.single("file"), asyncHandler(async (req, res) => {
  if (!req.file) return fail(res, 400, "Vui long chon hinh anh can tai len.");
  if (hasBlobStorage) {
    const ext = path.extname(req.file.originalname || "").toLowerCase() || ".jpg";
    const blob = await put(`uploads/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`, req.file.buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: req.file.mimetype
    });
    return ok(res, { message: "Tai hinh anh thanh cong.", url: blob.url, storage: "vercel-blob" }, 201);
  }
  if (isVercel) {
    return fail(res, 503, "Vercel can BLOB_READ_WRITE_TOKEN de tai anh len.");
  }
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  return ok(res, { message: "Tai hinh anh thanh cong.", url: `${baseUrl}/uploads/${req.file.filename}`, storage: "local" }, 201);
}));
app.get("/api/health/db", asyncHandler(async (req, res) => {
  const result = await prisma.$queryRaw`SELECT current_database() AS database, now() AS server_time`;
  return ok(res, { message: "Database connection is healthy", database: result[0]?.database, serverTime: result[0]?.server_time });
}));

app.get("/api/admin/ping", authenticateToken, authorizeRoles("ADMIN"), (req, res) => ok(res, { message: "Admin route ok" }));
app.get("/api/users/demo", (req, res) => ok(res, { users: [{ fullName: "Sinh viên demo", role: "STUDENT" }, { fullName: "Chủ trọ demo", role: "LANDLORD" }] }));
app.post("/api/echo", (req, res) => ok(res, { body: req.body || {} }));

// AUTH
app.post("/api/auth/register", asyncHandler(async (req, res) => {
  const fullName = clean(req.body.fullName || req.body.hoTen);
  const email = emailOf(req.body.email);
  const phone = opt(req.body.phone || req.body.soDT);
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const role = clean(req.body.role || req.body.loaiTaiKhoan).toUpperCase();

  if (!fullName || fullName.length < 2) return fail(res, 400, "Họ tên phải có ít nhất 2 ký tự.");
  if (!isEmail(email)) return fail(res, 400, "Email không hợp lệ.");
  if (!validatePassword(password)) return fail(res, 400, "Mật khẩu phải có ít nhất 6 ký tự.");
  if (!["STUDENT", "LANDLORD"].includes(role)) return fail(res, 400, "Vai trò phải là STUDENT hoặc LANDLORD.");

  const existed = await prisma.user.findFirst({ where: { OR: [{ email }, ...(phone ? [{ phone }] : [])] } });
  if (existed) return fail(res, 409, "Email hoặc số điện thoại đã tồn tại.");

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      phone,
      passwordHash: await hashPassword(password),
      role,
      verificationStatus: role === "LANDLORD" ? "NOT_SUBMITTED" : "VERIFIED"
    }
  });

  return ok(res, { message: "Đăng ký thành công.", token: signToken(user), user: toPublicUser(user) }, 201);
}));

app.post("/api/auth/login", asyncHandler(async (req, res) => {
  const email = emailOf(req.body.email || req.body.username);
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!isEmail(email)) return fail(res, 400, "Email không hợp lệ.");
  if (!password) return fail(res, 400, "Vui lòng nhập mật khẩu.");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.passwordHash))) return fail(res, 401, "Thông tin đăng nhập không chính xác.");
  if (user.status !== "ACTIVE") return fail(res, 403, "Tài khoản đã bị khóa hoặc vô hiệu hóa.", { reason: user.lockReason });

  return ok(res, { message: "Đăng nhập thành công.", token: signToken(user), user: toPublicUser(user) });
}));

app.get("/api/auth/me", authenticateToken, (req, res) => ok(res, { user: toPublicUser(req.user) }));
app.post("/api/auth/logout", authenticateToken, (req, res) => ok(res, { message: "Đăng xuất thành công. Frontend hãy xóa token khỏi localStorage." }));

app.post("/api/auth/forgot-password", asyncHandler(async (req, res) => {
  const email = emailOf(req.body.email);
  if (!isEmail(email)) return fail(res, 400, "Email không hợp lệ.");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return fail(res, 404, "Tài khoản không tồn tại.");
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  resetOtps.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
  return ok(res, { message: "Mã OTP đã được tạo. Bản local trả mã để kiểm thử.", devOtp: process.env.NODE_ENV === "production" ? undefined : otp });
}));

app.post("/api/auth/reset-password", asyncHandler(async (req, res) => {
  const email = emailOf(req.body.email);
  const otp = clean(req.body.otp);
  const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : "";
  const info = resetOtps.get(email);
  if (!info || info.otp !== otp || info.expiresAt < Date.now()) return fail(res, 400, "Mã xác thực không đúng hoặc đã hết hạn.");
  if (!validatePassword(newPassword)) return fail(res, 400, "Mật khẩu mới phải có ít nhất 6 ký tự.");
  await prisma.user.update({ where: { email }, data: { passwordHash: await hashPassword(newPassword) } });
  resetOtps.delete(email);
  return ok(res, { message: "Cập nhật mật khẩu thành công." });
}));

// PROFILE
app.get("/api/profile", authenticateToken, (req, res) => ok(res, { user: toPublicUser(req.user) }));
app.put("/api/profile", authenticateToken, asyncHandler(async (req, res) => {
  const fullName = clean(req.body.fullName || req.body.hoTen || req.user.fullName);
  const email = req.body.email === undefined ? req.user.email : emailOf(req.body.email);
  const phone = req.body.phone === undefined && req.body.soDT === undefined ? req.user.phone : opt(req.body.phone || req.body.soDT);
  const avatarUrl = req.body.avatarUrl === undefined ? req.user.avatarUrl : opt(req.body.avatarUrl);

  if (!fullName || fullName.length < 2) return fail(res, 400, "Họ tên phải có ít nhất 2 ký tự.");
  if (!isEmail(email)) return fail(res, 400, "Email không hợp lệ.");

  const duplicate = await prisma.user.findFirst({ where: { id: { not: req.user.id }, OR: [{ email }, ...(phone ? [{ phone }] : [])] } });
  if (duplicate) return fail(res, 409, "Email hoặc số điện thoại đã được sử dụng.");

  const user = await prisma.user.update({ where: { id: req.user.id }, data: { fullName, email, phone, avatarUrl } });
  return ok(res, { message: "Cập nhật thông tin cá nhân thành công.", user: toPublicUser(user) });
}));

app.put("/api/profile/change-password", authenticateToken, asyncHandler(async (req, res) => {
  const currentPassword = typeof req.body.currentPassword === "string" ? req.body.currentPassword : "";
  const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : "";
  const confirmPassword = typeof req.body.confirmPassword === "string" ? req.body.confirmPassword : newPassword;
  if (!currentPassword || !(await comparePassword(currentPassword, req.user.passwordHash))) return fail(res, 400, "Mật khẩu hiện tại không đúng.");
  if (!validatePassword(newPassword)) return fail(res, 400, "Mật khẩu mới phải có ít nhất 6 ký tự.");
  if (newPassword !== confirmPassword) return fail(res, 400, "Mật khẩu xác nhận không khớp.");
  await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash: await hashPassword(newPassword) } });
  return ok(res, { message: "Thay đổi mật khẩu thành công." });
}));

// PUBLIC ROOMS AND POSTS
app.get("/api/rooms", asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = pageInfo(req.query);
  const where = publicRoomWhere(req.query);
  const [rooms, total] = await Promise.all([
    prisma.room.findMany({ where, include: roomInclude, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.room.count({ where })
  ]);
  return ok(res, { rooms, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}));

app.get("/api/rooms/:id", asyncHandler(async (req, res) => {
  const room = await prisma.room.findFirst({
    where: { id: req.params.id, status: "AVAILABLE", posts: { some: { status: "APPROVED" } } },
    include: { ...roomInclude, reviews: { include: { student: { select: userSelect } }, orderBy: { createdAt: "desc" } } }
  });
  if (!room) return fail(res, 404, "Phòng trọ không còn tồn tại hoặc chưa được hiển thị công khai.");
  return ok(res, { room });
}));

app.get("/api/posts", asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = pageInfo(req.query);
  const q = clean(req.query.q || req.query.keyword || req.query.search);
  const and = [{ status: "APPROVED" }, { room: { status: "AVAILABLE" } }];
  if (q) and.push({ OR: [
    { title: { contains: q, mode: "insensitive" } },
    { description: { contains: q, mode: "insensitive" } },
    { room: { title: { contains: q, mode: "insensitive" } } },
    { room: { address: { contains: q, mode: "insensitive" } } }
  ] });
  const where = { AND: and };
  const [posts, total] = await Promise.all([
    prisma.post.findMany({ where, include: postInclude, orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }], skip, take }),
    prisma.post.count({ where })
  ]);
  return ok(res, { posts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}));

app.get("/api/posts/:id", asyncHandler(async (req, res) => {
  const post = await prisma.post.findFirst({ where: { id: req.params.id, status: "APPROVED", room: { status: "AVAILABLE" } }, include: postInclude });
  if (!post) return fail(res, 404, "Tin đăng không còn tồn tại hoặc đã bị gỡ.");
  return ok(res, { post });
}));

// LANDLORD ROOMS
app.get("/api/landlord/rooms", authenticateToken, authorizeRoles("LANDLORD"), asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = pageInfo(req.query);
  const where = { landlordId: req.user.id };
  const [rooms, total] = await Promise.all([
    prisma.room.findMany({ where, include: { images: { orderBy: { sortOrder: "asc" } }, posts: true }, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.room.count({ where })
  ]);
  return ok(res, { rooms, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}));

app.post("/api/landlord/rooms", authenticateToken, requireVerifiedLandlord, asyncHandler(async (req, res) => {
  const data = roomData(req.body);
  const error = validateRoom(data);
  if (error) return fail(res, 400, error);
  const images = Array.isArray(req.body.images) ? req.body.images : [];
  const room = await prisma.room.create({
    data: {
      ...data,
      landlordId: req.user.id,
      images: { create: images.filter((img) => img && img.url).map((img, index) => ({ url: clean(img.url), alt: opt(img.alt), sortOrder: intNum(img.sortOrder, index) })) }
    },
    include: { images: { orderBy: { sortOrder: "asc" } } }
  });
  return ok(res, { message: "Thêm phòng trọ thành công.", room }, 201);
}));

app.get("/api/landlord/rooms/:id", authenticateToken, authorizeRoles("LANDLORD"), asyncHandler(async (req, res) => {
  const room = await prisma.room.findFirst({ where: { id: req.params.id, landlordId: req.user.id }, include: { images: { orderBy: { sortOrder: "asc" } }, posts: true } });
  if (!room) return fail(res, 404, "Không tìm thấy phòng trọ thuộc quyền quản lý của bạn.");
  return ok(res, { room });
}));

app.put("/api/landlord/rooms/:id", authenticateToken, requireVerifiedLandlord, asyncHandler(async (req, res) => {
  const current = await prisma.room.findFirst({ where: { id: req.params.id, landlordId: req.user.id } });
  if (!current) return fail(res, 404, "Không tìm thấy phòng trọ thuộc quyền quản lý của bạn.");
  const data = roomData(req.body, current);
  const error = validateRoom(data);
  if (error) return fail(res, 400, error);
  const room = await prisma.room.update({ where: { id: current.id }, data, include: { images: true, posts: true } });
  return ok(res, { message: "Cập nhật thông tin phòng trọ thành công.", room });
}));

app.patch("/api/landlord/rooms/:id/status", authenticateToken, requireVerifiedLandlord, asyncHandler(async (req, res) => {
  const status = clean(req.body.status || req.body.trangThai).toUpperCase();
  if (!["AVAILABLE", "RENTED", "HIDDEN"].includes(status)) return fail(res, 400, "Trạng thái phòng không hợp lệ.");
  const current = await prisma.room.findFirst({ where: { id: req.params.id, landlordId: req.user.id } });
  if (!current) return fail(res, 404, "Không tìm thấy phòng trọ thuộc quyền quản lý của bạn.");
  const room = await prisma.room.update({ where: { id: current.id }, data: { status } });
  return ok(res, { message: "Cập nhật trạng thái phòng trọ thành công.", room });
}));

app.delete("/api/landlord/rooms/:id", authenticateToken, requireVerifiedLandlord, asyncHandler(async (req, res) => {
  const room = await prisma.room.findFirst({ where: { id: req.params.id, landlordId: req.user.id } });
  if (!room) return fail(res, 404, "Không tìm thấy phòng trọ thuộc quyền quản lý của bạn.");
  if (room.status === "RENTED") return fail(res, 400, "Không thể xóa phòng đang có người thuê.");
  await prisma.room.delete({ where: { id: room.id } });
  return ok(res, { message: "Xóa phòng trọ thành công." });
}));

// LANDLORD POSTS
app.get("/api/landlord/posts", authenticateToken, authorizeRoles("LANDLORD"), asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = pageInfo(req.query);
  const status = clean(req.query.status || req.query.trangThai).toUpperCase();
  const where = { landlordId: req.user.id, ...(["PENDING", "APPROVED", "REJECTED", "HIDDEN", "DELETED"].includes(status) ? { status } : {}) };
  const [posts, total] = await Promise.all([
    prisma.post.findMany({ where, include: postInclude, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.post.count({ where })
  ]);
  return ok(res, { posts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}));

app.post("/api/landlord/posts", authenticateToken, requireVerifiedLandlord, asyncHandler(async (req, res) => {
  const title = clean(req.body.title || req.body.tieuDe);
  const description = clean(req.body.description || req.body.moTa);
  const roomId = clean(req.body.roomId || req.body.maPhongTro);
  const imageUrl = opt(req.body.imageUrl || req.body.hinhAnh);
  const images = Array.isArray(req.body.images) ? req.body.images : [];
  if (!title || title.length < 5) return fail(res, 400, "Tiêu đề bài đăng phải có ít nhất 5 ký tự.");
  if (!description || description.length < 10) return fail(res, 400, "Mô tả bài đăng phải có ít nhất 10 ký tự.");
  if (!roomId) return fail(res, 400, "Vui lòng chọn phòng trọ để tạo bài đăng.");
  if (!imageUrl && !images.some((img) => img && img.url)) return fail(res, 400, "Vui lòng thêm hình ảnh phòng trọ cho bài đăng.");
  const room = await prisma.room.findFirst({ where: { id: roomId, landlordId: req.user.id } });
  if (!room) return fail(res, 404, "Không tìm thấy phòng trọ thuộc quyền quản lý của bạn.");

  const normalizedImages = [
    ...(imageUrl ? [{ url: imageUrl, alt: title }] : []),
    ...images.filter((img) => img && img.url).map((img) => ({ url: clean(img.url), alt: opt(img.alt) || title }))
  ];

  await Promise.all(normalizedImages.map((img, index) => prisma.roomImage.create({
    data: { roomId: room.id, url: img.url, alt: img.alt, sortOrder: index }
  })));

  const post = await prisma.post.create({ data: { landlordId: req.user.id, roomId, title, description, status: "PENDING" }, include: postInclude });
  return ok(res, { message: "Tạo bài đăng thành công. Bài đăng đang chờ admin kiểm duyệt.", post }, 201);
}));

app.get("/api/landlord/posts/:id", authenticateToken, authorizeRoles("LANDLORD"), asyncHandler(async (req, res) => {
  const post = await prisma.post.findFirst({ where: { id: req.params.id, landlordId: req.user.id }, include: postInclude });
  if (!post) return fail(res, 404, "Không tìm thấy bài đăng thuộc quyền quản lý của bạn.");
  return ok(res, { post });
}));

app.put("/api/landlord/posts/:id", authenticateToken, requireVerifiedLandlord, asyncHandler(async (req, res) => {
  const current = await prisma.post.findFirst({ where: { id: req.params.id, landlordId: req.user.id } });
  if (!current || current.status === "DELETED") return fail(res, 404, "Không tìm thấy bài đăng thuộc quyền quản lý của bạn.");
  const title = clean(req.body.title || req.body.tieuDe || current.title);
  const description = clean(req.body.description || req.body.moTa || current.description);
  const roomId = clean(req.body.roomId || req.body.maPhongTro || current.roomId);
  if (title.length < 5) return fail(res, 400, "Tiêu đề bài đăng phải có ít nhất 5 ký tự.");
  if (description.length < 10) return fail(res, 400, "Mô tả bài đăng phải có ít nhất 10 ký tự.");
  const room = await prisma.room.findFirst({ where: { id: roomId, landlordId: req.user.id } });
  if (!room) return fail(res, 404, "Không tìm thấy phòng trọ thuộc quyền quản lý của bạn.");
  const post = await prisma.post.update({ where: { id: current.id }, data: { title, description, roomId, status: "PENDING", rejectReason: null, hiddenAt: null }, include: postInclude });
  return ok(res, { message: "Cập nhật bài đăng thành công. Bài đăng chuyển về trạng thái chờ duyệt.", post });
}));

app.patch("/api/landlord/posts/:id/hide", authenticateToken, requireVerifiedLandlord, asyncHandler(async (req, res) => {
  const current = await prisma.post.findFirst({ where: { id: req.params.id, landlordId: req.user.id } });
  if (!current || current.status === "DELETED") return fail(res, 404, "Không tìm thấy bài đăng thuộc quyền quản lý của bạn.");
  if (current.status === "HIDDEN") return fail(res, 400, "Bài đăng này đang được ẩn rồi.");
  const post = await prisma.post.update({ where: { id: current.id }, data: { status: "HIDDEN", hiddenAt: new Date() }, include: postInclude });
  return ok(res, { message: "Ẩn bài đăng thành công.", post });
}));

app.patch("/api/landlord/posts/:id/unhide", authenticateToken, requireVerifiedLandlord, asyncHandler(async (req, res) => {
  const current = await prisma.post.findFirst({ where: { id: req.params.id, landlordId: req.user.id } });
  if (!current || current.status === "DELETED") return fail(res, 404, "Không tìm thấy bài đăng thuộc quyền quản lý của bạn.");
  if (current.status !== "HIDDEN") return fail(res, 400, "Chỉ có thể hiện lại bài đăng đang bị ẩn.");

  // Nếu bài đăng từng được duyệt rồi thì hiện lại về ĐÃ DUYỆT.
  // Nếu bài đăng chưa từng được duyệt thì chuyển về CHỜ DUYỆT để admin kiểm duyệt.
  const nextStatus = current.publishedAt ? "APPROVED" : "PENDING";
  const post = await prisma.post.update({
    where: { id: current.id },
    data: { status: nextStatus, hiddenAt: null, rejectReason: null },
    include: postInclude
  });
  return ok(res, { message: nextStatus === "APPROVED" ? "Bài đăng đã được hiện lại." : "Bài đăng đã chuyển về trạng thái chờ duyệt.", post });
}));

app.delete("/api/landlord/posts/:id", authenticateToken, requireVerifiedLandlord, asyncHandler(async (req, res) => {
  const current = await prisma.post.findFirst({ where: { id: req.params.id, landlordId: req.user.id } });
  if (!current || current.status === "DELETED") return fail(res, 404, "Không tìm thấy bài đăng thuộc quyền quản lý của bạn.");
  await prisma.post.update({ where: { id: current.id }, data: { status: "DELETED", deletedAt: new Date() } });
  return ok(res, { message: "Xóa bài đăng thành công." });
}));

// VERIFICATION
app.get("/api/verification/me", authenticateToken, authorizeRoles("LANDLORD"), asyncHandler(async (req, res) => {
  const requests = await prisma.verificationProfile.findMany({ where: { landlordId: req.user.id }, orderBy: { createdAt: "desc" } });
  return ok(res, { verificationStatus: req.user.verificationStatus, requests });
}));

app.post("/api/verification/requests", authenticateToken, authorizeRoles("LANDLORD"), asyncHandler(async (req, res) => {
  if (req.user.verificationStatus === "VERIFIED") return fail(res, 400, "Tài khoản chủ trọ đã được xác minh.");
  const fullName = clean(req.body.fullName || req.body.hoTen || req.user.fullName);
  const phone = opt(req.body.phone || req.body.soDT || req.user.phone);
  const address = opt(req.body.address || req.body.diaChi);
  const documentType = opt(req.body.documentType || req.body.loaiGiayTo);
  const documentNumber = opt(req.body.documentNumber || req.body.soGiayTo);
  const documentUrl = opt(req.body.documentUrl || req.body.fileGiayTo || req.body.giayTo);
  const note = opt(req.body.note || req.body.ghiChu);
  if (!fullName || !documentType || !documentNumber || !documentUrl) return fail(res, 400, "Vui lòng nhập đầy đủ thông tin và giấy tờ xác minh.");
  const request = await prisma.$transaction(async (tx) => {
    const created = await tx.verificationProfile.create({ data: { landlordId: req.user.id, fullName, phone, address, documentType, documentNumber, documentUrl, note, status: "PENDING" } });
    await tx.user.update({ where: { id: req.user.id }, data: { verificationStatus: "PENDING" } });
    return created;
  });
  return ok(res, { message: "Gửi yêu cầu xác minh tài khoản thành công.", request }, 201);
}));

// REPORTS
app.post("/api/reports", authenticateToken, authorizeRoles("STUDENT"), asyncHandler(async (req, res) => {
  const postId = clean(req.body.postId || req.body.maBaiDang);
  const reason = clean(req.body.reason || req.body.lyDo);
  const content = opt(req.body.content || req.body.noiDung);
  if (!postId || !reason) return fail(res, 400, "Vui lòng chọn bài đăng và nhập lý do báo cáo.");
  const post = await prisma.post.findFirst({ where: { id: postId, status: { not: "DELETED" } } });
  if (!post) return fail(res, 404, "Bài đăng không tồn tại hoặc đã bị xóa.");
  const report = await prisma.report.create({ data: { reporterId: req.user.id, postId, reason, content } });
  return ok(res, { message: "Gửi báo cáo vi phạm thành công.", report }, 201);
}));

app.get("/api/my/reports", authenticateToken, asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = pageInfo(req.query);
  const where = { reporterId: req.user.id };
  const [reports, total] = await Promise.all([
    prisma.report.findMany({ where, include: { post: { include: { room: true } } }, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.report.count({ where })
  ]);
  return ok(res, { reports, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}));

// MESSAGES
async function threadForUser(threadId, userId) {
  return prisma.messageThread.findFirst({
    where: { id: threadId, OR: [{ studentId: userId }, { landlordId: userId }] },
    include: { student: { select: userSelect }, landlord: { select: userSelect }, post: true, room: true }
  });
}

app.get("/api/messages/threads", authenticateToken, asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = pageInfo(req.query);
  const where = { OR: [{ studentId: req.user.id }, { landlordId: req.user.id }] };
  const [threads, total] = await Promise.all([
    prisma.messageThread.findMany({
      where,
      include: { student: { select: userSelect }, landlord: { select: userSelect }, post: true, room: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
      skip,
      take
    }),
    prisma.messageThread.count({ where })
  ]);
  return ok(res, { threads, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}));

app.post("/api/messages/threads", authenticateToken, asyncHandler(async (req, res) => {
  const studentId = req.user.role === "STUDENT" ? req.user.id : clean(req.body.studentId || req.body.maSinhVien);
  let landlordId = req.user.role === "LANDLORD" ? req.user.id : clean(req.body.landlordId || req.body.maChuTro);
  const postId = clean(req.body.postId || req.body.maBaiDang) || null;
  const roomId = clean(req.body.roomId || req.body.maPhongTro) || null;
  const content = clean(req.body.content || req.body.noiDung || req.body.message);

  if (postId && !landlordId) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    landlordId = post?.landlordId || "";
  }
  if (roomId && !landlordId) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    landlordId = room?.landlordId || "";
  }
  if (!studentId || !landlordId) return fail(res, 400, "Thiếu thông tin sinh viên hoặc chủ trọ để tạo cuộc trò chuyện.");
  if (studentId === landlordId) return fail(res, 400, "Không thể nhắn tin với chính mình.");

  const student = await prisma.user.findFirst({ where: { id: studentId, role: "STUDENT" } });
  const landlord = await prisma.user.findFirst({ where: { id: landlordId, role: "LANDLORD" } });
  if (!student || !landlord) return fail(res, 404, "Không tìm thấy sinh viên hoặc chủ trọ phù hợp.");

  const existing = await prisma.messageThread.findFirst({ where: { studentId, landlordId, postId, roomId } });
  const thread = await prisma.$transaction(async (tx) => {
    const active = existing || await tx.messageThread.create({ data: { studentId, landlordId, postId, roomId } });
    if (content) {
      await tx.message.create({ data: { threadId: active.id, senderId: req.user.id, content } });
      await tx.messageThread.update({ where: { id: active.id }, data: { updatedAt: new Date() } });
    }
    return tx.messageThread.findUnique({ where: { id: active.id }, include: { student: { select: userSelect }, landlord: { select: userSelect }, post: true, room: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } } });
  });
  return ok(res, { message: existing ? "Mở cuộc trò chuyện hiện có." : "Tạo cuộc trò chuyện thành công.", thread }, existing ? 200 : 201);
}));

app.get("/api/messages/threads/:id/messages", authenticateToken, asyncHandler(async (req, res) => {
  const thread = await threadForUser(req.params.id, req.user.id);
  if (!thread) return fail(res, 404, "Không tìm thấy cuộc trò chuyện.");
  const { page, limit, skip, take } = pageInfo(req.query);
  const where = { threadId: thread.id };
  const [messages, total] = await Promise.all([
    prisma.message.findMany({ where, include: { sender: { select: userSelect } }, orderBy: { createdAt: "asc" }, skip, take }),
    prisma.message.count({ where })
  ]);
  await prisma.message.updateMany({ where: { threadId: thread.id, senderId: { not: req.user.id }, readAt: null }, data: { readAt: new Date() } });
  return ok(res, { thread, messages, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}));

app.post("/api/messages/threads/:id/messages", authenticateToken, asyncHandler(async (req, res) => {
  const thread = await threadForUser(req.params.id, req.user.id);
  if (!thread) return fail(res, 404, "Không tìm thấy cuộc trò chuyện.");
  if (thread.status === "CLOSED") return fail(res, 400, "Cuộc trò chuyện đã đóng.");
  const content = clean(req.body.content || req.body.noiDung || req.body.message);
  if (!content) return fail(res, 400, "Nội dung tin nhắn không được để trống.");
  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({ data: { threadId: thread.id, senderId: req.user.id, content }, include: { sender: { select: userSelect } } });
    await tx.messageThread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });
    const receiverId = req.user.id === thread.studentId ? thread.landlordId : thread.studentId;
    await tx.notification.create({ data: { userId: receiverId, type: "MESSAGE", title: "Bạn có tin nhắn mới", content } });
    return created;
  });
  return ok(res, { message: "Gửi tin nhắn thành công.", data: message }, 201);
}));

// FAVORITES AND REVIEWS
app.get("/api/favorites", authenticateToken, authorizeRoles("STUDENT"), asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = pageInfo(req.query);
  const where = { userId: req.user.id };
  const [favorites, total] = await Promise.all([
    prisma.favorite.findMany({ where, include: { room: { include: { images: true, posts: { where: { status: "APPROVED" }, take: 1 } } } }, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.favorite.count({ where })
  ]);
  return ok(res, { favorites, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}));

app.post("/api/favorites/:roomId", authenticateToken, authorizeRoles("STUDENT"), asyncHandler(async (req, res) => {
  const room = await prisma.room.findFirst({ where: { id: req.params.roomId, status: "AVAILABLE", posts: { some: { status: "APPROVED" } } } });
  if (!room) return fail(res, 404, "Phòng trọ không tồn tại hoặc chưa được hiển thị công khai.");
  const favorite = await prisma.favorite.upsert({ where: { userId_roomId: { userId: req.user.id, roomId: room.id } }, update: {}, create: { userId: req.user.id, roomId: room.id } });
  return ok(res, { message: "Đã lưu phòng trọ yêu thích.", favorite }, 201);
}));

app.delete("/api/favorites/:roomId", authenticateToken, authorizeRoles("STUDENT"), asyncHandler(async (req, res) => {
  await prisma.favorite.deleteMany({ where: { userId: req.user.id, roomId: req.params.roomId } });
  return ok(res, { message: "Đã bỏ lưu phòng trọ yêu thích." });
}));

app.get("/api/rooms/:roomId/reviews", asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = pageInfo(req.query);
  const where = { roomId: req.params.roomId };
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({ where, include: { student: { select: userSelect } }, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.review.count({ where })
  ]);
  return ok(res, { reviews, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}));

app.post("/api/rooms/:roomId/reviews", authenticateToken, authorizeRoles("STUDENT"), asyncHandler(async (req, res) => {
  const rating = intNum(req.body.rating || req.body.danhGia);
  const content = opt(req.body.content || req.body.noiDung);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail(res, 400, "Điểm đánh giá phải từ 1 đến 5.");
  const room = await prisma.room.findFirst({ where: { id: req.params.roomId, posts: { some: { status: "APPROVED" } } } });
  if (!room) return fail(res, 404, "Phòng trọ không tồn tại hoặc chưa được hiển thị công khai.");
  const review = await prisma.review.upsert({ where: { studentId_roomId: { studentId: req.user.id, roomId: room.id } }, update: { rating, content }, create: { studentId: req.user.id, roomId: room.id, rating, content }, include: { student: { select: userSelect } } });
  return ok(res, { message: "Gửi đánh giá phòng trọ thành công.", review }, 201);
}));

app.get("/api/notifications", authenticateToken, asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = pageInfo(req.query);
  const where = { userId: req.user.id };
  const [notifications, total, unread] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: req.user.id, isRead: false } })
  ]);
  return ok(res, { notifications, unread, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}));

app.patch("/api/notifications/:id/read", authenticateToken, asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: { isRead: true } });
  return ok(res, { message: "Đã đánh dấu thông báo là đã đọc." });
}));

// ADMIN
app.get("/api/admin/dashboard", authenticateToken, authorizeRoles("ADMIN"), asyncHandler(async (req, res) => {
  const [users, rooms, posts, pendingPosts, reports, pendingReports, verifications] = await Promise.all([
    prisma.user.count(),
    prisma.room.count(),
    prisma.post.count({ where: { status: { not: "DELETED" } } }),
    prisma.post.count({ where: { status: "PENDING" } }),
    prisma.report.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.verificationProfile.count({ where: { status: "PENDING" } })
  ]);
  return ok(res, { stats: { users, rooms, posts, pendingPosts, reports, pendingReports, verifications } });
}));

app.get("/api/admin/users", authenticateToken, authorizeRoles("ADMIN"), asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = pageInfo(req.query);
  const q = clean(req.query.q || req.query.keyword || req.query.search);
  const role = clean(req.query.role).toUpperCase();
  const status = clean(req.query.status).toUpperCase();
  const and = [];
  if (q) and.push({ OR: [{ fullName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q, mode: "insensitive" } }] });
  if (["STUDENT", "LANDLORD", "ADMIN"].includes(role)) and.push({ role });
  if (["ACTIVE", "LOCKED", "DISABLED"].includes(status)) and.push({ status });
  const where = and.length ? { AND: and } : {};
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, select: { ...userSelect, _count: { select: { rooms: true, posts: true, reports: true } } }, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.user.count({ where })
  ]);
  return ok(res, { users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}));

app.get("/api/admin/users/:id", authenticateToken, authorizeRoles("ADMIN"), asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { ...userSelect, rooms: { take: 5, orderBy: { createdAt: "desc" } }, posts: { take: 5, orderBy: { createdAt: "desc" } }, accountLogs: { take: 10, orderBy: { createdAt: "desc" } }, verificationProfiles: { take: 5, orderBy: { createdAt: "desc" } } }
  });
  if (!user) return fail(res, 404, "Không tìm thấy tài khoản người dùng.");
  return ok(res, { user });
}));

app.patch("/api/admin/users/:id/lock", authenticateToken, authorizeRoles("ADMIN"), asyncHandler(async (req, res) => {
  const reason = clean(req.body.reason || req.body.lyDo);
  if (!reason) return fail(res, 400, "Vui lòng nhập lý do khóa tài khoản.");
  if (req.params.id === req.user.id) return fail(res, 400, "Admin không thể tự khóa tài khoản đang đăng nhập.");
  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({ where: { id: req.params.id }, data: { status: "LOCKED", lockReason: reason } });
    await tx.accountLog.create({ data: { userId: updated.id, adminId: req.user.id, action: "LOCK_ACCOUNT", reason } });
    await tx.notification.create({ data: { userId: updated.id, type: "ACCOUNT_LOCKED", title: "Tài khoản đã bị khóa", content: reason } });
    return updated;
  });
  return ok(res, { message: "Khóa tài khoản thành công.", user: toPublicUser(user) });
}));

app.patch("/api/admin/users/:id/unlock", authenticateToken, authorizeRoles("ADMIN"), asyncHandler(async (req, res) => {
  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({ where: { id: req.params.id }, data: { status: "ACTIVE", lockReason: null } });
    await tx.accountLog.create({ data: { userId: updated.id, adminId: req.user.id, action: "UNLOCK_ACCOUNT" } });
    await tx.notification.create({ data: { userId: updated.id, type: "ACCOUNT_UNLOCKED", title: "Tài khoản đã được mở khóa", content: "Bạn có thể tiếp tục sử dụng hệ thống." } });
    return updated;
  });
  return ok(res, { message: "Mở khóa tài khoản thành công.", user: toPublicUser(user) });
}));

app.get("/api/admin/posts", authenticateToken, authorizeRoles("ADMIN"), asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = pageInfo(req.query);
  const q = clean(req.query.q || req.query.keyword || req.query.search);
  const status = clean(req.query.status || req.query.trangThai).toUpperCase();
  const district = clean(req.query.district || req.query.khuVuc);
  const landlordId = clean(req.query.landlordId || req.query.maChuTro);
  const and = [];
  if (q) and.push({ OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { landlord: { fullName: { contains: q, mode: "insensitive" } } }, { room: { address: { contains: q, mode: "insensitive" } } }] });
  if (["PENDING", "APPROVED", "REJECTED", "HIDDEN", "DELETED"].includes(status)) and.push({ status });
  if (district) and.push({ room: { district: { contains: district, mode: "insensitive" } } });
  if (landlordId) and.push({ landlordId });
  const where = and.length ? { AND: and } : {};
  const [posts, total] = await Promise.all([
    prisma.post.findMany({ where, include: postInclude, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.post.count({ where })
  ]);
  return ok(res, { posts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}));

app.get("/api/admin/posts/:id", authenticateToken, authorizeRoles("ADMIN"), asyncHandler(async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id }, include: postInclude });
  if (!post) return fail(res, 404, "Không tìm thấy bài đăng.");
  return ok(res, { post });
}));

app.patch("/api/admin/posts/:id/moderate", authenticateToken, authorizeRoles("ADMIN"), asyncHandler(async (req, res) => {
  const action = clean(req.body.action || req.body.hanhDong).toLowerCase();
  const reason = clean(req.body.reason || req.body.lyDo || req.body.rejectReason);
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post || post.status === "DELETED") return fail(res, 404, "Không tìm thấy bài đăng cần kiểm duyệt.");
  let data, title, content;
  if (["approve", "approved", "duyet", "phe_duyet"].includes(action)) {
    data = { status: "APPROVED", rejectReason: null, publishedAt: new Date(), hiddenAt: null };
    title = "Bài đăng đã được phê duyệt";
    content = post.title;
  } else if (["reject", "rejected", "tu_choi"].includes(action)) {
    if (!reason) return fail(res, 400, "Vui lòng nhập lý do từ chối bài đăng.");
    data = { status: "REJECTED", rejectReason: reason };
    title = "Bài đăng đã bị từ chối";
    content = reason;
  } else if (["hide", "an"].includes(action)) {
    data = { status: "HIDDEN", hiddenAt: new Date() };
    title = "Bài đăng đã bị ẩn";
    content = reason || post.title;
  } else {
    return fail(res, 400, "Hành động không hợp lệ. Dùng approve, reject hoặc hide.");
  }
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.post.update({ where: { id: post.id }, data, include: postInclude });
    await tx.notification.create({ data: { userId: post.landlordId, type: data.status === "APPROVED" ? "POST_APPROVED" : "POST_REJECTED", title, content } });
    return result;
  });
  return ok(res, { message: "Cập nhật trạng thái bài đăng thành công.", post: updated });
}));

app.get("/api/admin/verifications", authenticateToken, authorizeRoles("ADMIN"), asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = pageInfo(req.query);
  const status = clean(req.query.status || req.query.trangThai).toUpperCase();
  const where = ["PENDING", "VERIFIED", "REJECTED", "NOT_SUBMITTED"].includes(status) ? { status } : {};
  const [requests, total] = await Promise.all([
    prisma.verificationProfile.findMany({ where, include: { landlord: { select: userSelect } }, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.verificationProfile.count({ where })
  ]);
  return ok(res, { requests, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}));

app.patch("/api/admin/verifications/:id", authenticateToken, authorizeRoles("ADMIN"), asyncHandler(async (req, res) => {
  const action = clean(req.body.action || req.body.hanhDong).toLowerCase();
  const reason = clean(req.body.reason || req.body.lyDo || req.body.rejectionReason);
  const request = await prisma.verificationProfile.findUnique({ where: { id: req.params.id } });
  if (!request) return fail(res, 404, "Không tìm thấy hồ sơ xác minh.");
  let status, userVerificationStatus, title, content;
  if (["approve", "approved", "xac_nhan", "duyet"].includes(action)) {
    status = "VERIFIED";
    userVerificationStatus = "VERIFIED";
    title = "Tài khoản chủ trọ đã được xác minh";
    content = "Bạn có thể tạo phòng trọ và bài đăng cho thuê.";
  } else if (["reject", "rejected", "tu_choi"].includes(action)) {
    if (!reason) return fail(res, 400, "Vui lòng nhập lý do từ chối xác minh.");
    status = "REJECTED";
    userVerificationStatus = "REJECTED";
    title = "Hồ sơ xác minh đã bị từ chối";
    content = reason;
  } else {
    return fail(res, 400, "Hành động xác minh không hợp lệ. Dùng approve hoặc reject.");
  }
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.verificationProfile.update({ where: { id: request.id }, data: { status, rejectionReason: status === "REJECTED" ? reason : null, reviewedAt: new Date() }, include: { landlord: { select: userSelect } } });
    await tx.user.update({ where: { id: request.landlordId }, data: { verificationStatus: userVerificationStatus } });
    await tx.notification.create({ data: { userId: request.landlordId, type: status === "VERIFIED" ? "VERIFICATION_APPROVED" : "VERIFICATION_REJECTED", title, content } });
    return result;
  });
  return ok(res, { message: "Cập nhật trạng thái xác minh thành công.", request: updated });
}));

app.get("/api/admin/reports", authenticateToken, authorizeRoles("ADMIN"), asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = pageInfo(req.query);
  const status = clean(req.query.status || req.query.trangThai).toUpperCase();
  const where = ["PENDING", "RESOLVED", "REJECTED"].includes(status) ? { status } : {};
  const [reports, total] = await Promise.all([
    prisma.report.findMany({ where, include: { reporter: { select: userSelect }, post: { include: postInclude } }, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.report.count({ where })
  ]);
  return ok(res, { reports, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}));

app.patch("/api/admin/reports/:id/resolve", authenticateToken, authorizeRoles("ADMIN"), asyncHandler(async (req, res) => {
  const action = clean(req.body.action || req.body.hanhDong).toLowerCase();
  const adminNote = clean(req.body.adminNote || req.body.ghiChu || req.body.reason || req.body.lyDo);
  const hidePost = Boolean(req.body.hidePost);
  const lockLandlord = Boolean(req.body.lockLandlord);
  const report = await prisma.report.findUnique({ where: { id: req.params.id }, include: { post: true } });
  if (!report) return fail(res, 404, "Không tìm thấy báo cáo vi phạm.");
  const status = ["reject", "rejected", "tu_choi"].includes(action) ? "REJECTED" : "RESOLVED";
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.report.update({ where: { id: report.id }, data: { status, adminNote: adminNote || null, resolvedAt: new Date() }, include: { reporter: { select: userSelect }, post: { include: postInclude } } });
    if (status === "RESOLVED" && hidePost) await tx.post.update({ where: { id: report.postId }, data: { status: "HIDDEN", hiddenAt: new Date() } });
    if (status === "RESOLVED" && lockLandlord) {
      await tx.user.update({ where: { id: report.post.landlordId }, data: { status: "LOCKED", lockReason: adminNote || "Vi phạm nội quy hệ thống." } });
      await tx.accountLog.create({ data: { userId: report.post.landlordId, adminId: req.user.id, action: "LOCK_ACCOUNT_BY_REPORT", reason: adminNote || "Vi phạm nội quy hệ thống." } });
    }
    await tx.notification.create({ data: { userId: report.reporterId, type: "REPORT_RESOLVED", title: status === "RESOLVED" ? "Báo cáo đã được xử lý" : "Báo cáo đã bị từ chối", content: adminNote || "Admin đã cập nhật trạng thái báo cáo của bạn." } });
    return result;
  });
  return ok(res, { message: "Cập nhật trạng thái báo cáo thành công.", report: updated });
}));

app.use((req, res) => fail(res, 404, "Route not found"));

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return fail(res, 413, `Kich thuoc anh vuot qua ${Math.floor(maxUploadSize / (1024 * 1024))}MB.`);
  }
  console.error(error);
  return fail(res, 500, "Lỗi hệ thống.", { error: process.env.NODE_ENV === "production" ? undefined : error.message });
});

const PORT = process.env.PORT || 3001;

let server = null;

if (!isVercel) {
  server = app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });

  async function shutdown(signal) {
    console.log(`${signal} received. Closing server...`);
    await prisma.$disconnect();
    server.close(() => process.exit(0));
  }

  process.on("SIGINT", () => shutdown("SIGINT").catch((error) => { console.error(error); process.exit(1); }));
  process.on("SIGTERM", () => shutdown("SIGTERM").catch((error) => { console.error(error); process.exit(1); }));
}

module.exports = app;