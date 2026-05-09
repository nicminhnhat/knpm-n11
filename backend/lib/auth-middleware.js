const prisma = require("./prisma");
const { getBearerToken, verifyToken } = require("./auth");

async function authenticateToken(req, res, next) {
  try {
    const token = getBearerToken(req.headers.authorization || "");
    if (!token) return res.status(401).json({ success: false, message: "Bạn cần đăng nhập." });

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ success: false, message: "Tài khoản không còn tồn tại." });
    if (user.status !== "ACTIVE") {
      return res.status(403).json({ success: false, message: "Tài khoản đã bị khóa hoặc vô hiệu hóa.", reason: user.lockReason });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn." });
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: "Bạn cần đăng nhập." });
    if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập chức năng này." });
    return next();
  };
}

function requireVerifiedLandlord(req, res, next) {
  if (!req.user) return res.status(401).json({ success: false, message: "Bạn cần đăng nhập." });
  if (req.user.role !== "LANDLORD") return res.status(403).json({ success: false, message: "Chức năng này chỉ dành cho chủ trọ." });
  if (req.user.verificationStatus !== "VERIFIED") {
    return res.status(403).json({ success: false, message: "Tài khoản chủ trọ cần được admin xác minh trước.", verificationStatus: req.user.verificationStatus });
  }
  return next();
}

module.exports = { authenticateToken, authorizeRoles, requireVerifiedLandlord };
