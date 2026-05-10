const authService = require("../services/auth.service");
const { signToken, toPublicUser } = require("../lib/auth");
const { ok, fail, clean, opt, emailOf, isEmail, validatePassword } = require("../utils/helpers");

class AuthController {
  async register(req, res) {
    const fullName = clean(req.body.fullName || req.body.hoTen);
    const email = emailOf(req.body.email);
    const phone = opt(req.body.phone || req.body.soDT);
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const role = clean(req.body.role || req.body.loaiTaiKhoan).toUpperCase();

    if (!fullName || fullName.length < 2) return fail(res, 400, "Họ tên phải có ít nhất 2 ký tự.");
    if (!isEmail(email)) return fail(res, 400, "Email không hợp lệ.");
    if (!validatePassword(password)) return fail(res, 400, "Mật khẩu phải có ít nhất 6 ký tự.");
    if (!["STUDENT", "LANDLORD"].includes(role)) return fail(res, 400, "Vai trò phải là STUDENT hoặc LANDLORD.");

    const existed = await authService.findUserByEmailOrPhone(email, phone);
    if (existed) return fail(res, 409, "Email hoặc số điện thoại đã tồn tại.");

    const user = await authService.createUser({
      fullName,
      email,
      phone,
      password,
      role,
      verificationStatus: role === "LANDLORD" ? "NOT_SUBMITTED" : "VERIFIED"
    });

    return ok(res, { message: "Đăng ký thành công.", token: signToken(user), user: toPublicUser(user) }, 201);
  }

  async login(req, res) {
    const email = emailOf(req.body.email || req.body.username);
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!isEmail(email)) return fail(res, 400, "Email không hợp lệ.");
    if (!password) return fail(res, 400, "Vui lòng nhập mật khẩu.");

    const user = await authService.findUserByEmail(email);
    if (!user || !(await authService.checkPassword(password, user.passwordHash))) return fail(res, 401, "Thông tin đăng nhập không chính xác.");
    if (user.status !== "ACTIVE") return fail(res, 403, "Tài khoản đã bị khóa hoặc vô hiệu hóa.", { reason: user.lockReason });

    return ok(res, { message: "Đăng nhập thành công.", token: signToken(user), user: toPublicUser(user) });
  }

  me(req, res) {
    return ok(res, { user: toPublicUser(req.user) });
  }

  logout(req, res) {
    return ok(res, { message: "Đăng xuất thành công. Frontend hãy xóa token khỏi localStorage." });
  }

  async forgotPassword(req, res) {
    const email = emailOf(req.body.email);
    if (!isEmail(email)) return fail(res, 400, "Email không hợp lệ.");
    const user = await authService.findUserByEmail(email);
    if (!user) return fail(res, 404, "Tài khoản không tồn tại.");
    const otp = authService.createOtp(email);
    return ok(res, { message: "Mã OTP đã được tạo. Bản local trả mã để kiểm thử.", devOtp: process.env.NODE_ENV === "production" ? undefined : otp });
  }

  async resetPassword(req, res) {
    const email = emailOf(req.body.email);
    const otp = clean(req.body.otp);
    const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : "";
    
    if (!authService.verifyOtp(email, otp)) return fail(res, 400, "Mã xác thực không đúng hoặc đã hết hạn.");
    if (!validatePassword(newPassword)) return fail(res, 400, "Mật khẩu mới phải có ít nhất 6 ký tự.");
    
    await authService.updatePassword(email, newPassword);
    authService.deleteOtp(email);
    return ok(res, { message: "Cập nhật mật khẩu thành công." });
  }
}

module.exports = new AuthController();
