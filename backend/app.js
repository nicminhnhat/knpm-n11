require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { put } = require("@vercel/blob");
const prisma = require("./lib/prisma");

const { authenticateToken } = require("./lib/auth-middleware");
const { asyncHandler, ok, fail } = require("./utils/helpers");
const apiRoutes = require("./routes");

const app = express();
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

// Sử dụng các routes đã được chia nhỏ
app.use("/api", apiRoutes);

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