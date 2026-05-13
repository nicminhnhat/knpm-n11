const authService = require("../services/auth.service");
const emailService = require("../services/email.service");
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

    const genericMessage = "Nếu email tồn tại trong hệ thống, mã xác nhận đã được gửi.";
    const user = await authService.findUserByEmail(email);

    if (!user || user.status !== "ACTIVE") {
      return ok(res, { message: genericMessage });
    }

    const otp = await authService.createPasswordResetOtp(user);
    const mailResult = await emailService.sendPasswordResetOtp(user.email, otp);
    await authService.cleanupExpiredPasswordResetTokens().catch(() => null);

    if (!mailResult.sent && !mailResult.devMode) {
      return fail(res, 500, "Không thể gửi mã xác nhận. Vui lòng thử lại sau.");
    }

    return ok(res, {
      message: genericMessage,
      devOtp: process.env.NODE_ENV !== "production" && mailResult.devMode ? otp : undefined
    });
  }

  async verifyResetOtp(req, res) {
    const email = emailOf(req.body.email);
    const otp = clean(req.body.otp);

    if (!isEmail(email)) return fail(res, 400, "Email không hợp lệ.");
    if (!/^\d{6}$/.test(otp)) return fail(res, 400, "Mã OTP phải gồm 6 chữ số.");

    const isValid = await authService.verifyPasswordResetOtp(email, otp);
    if (!isValid) return fail(res, 400, "Mã xác nhận không đúng hoặc đã hết hạn.");

    return ok(res, { message: "Mã xác nhận hợp lệ." });
  }

  async resetPassword(req, res) {
    const email = emailOf(req.body.email);
    const otp = clean(req.body.otp);
    const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : "";
    const confirmPassword = typeof req.body.confirmPassword === "string" ? req.body.confirmPassword : "";

    if (!isEmail(email)) return fail(res, 400, "Email không hợp lệ.");
    if (!/^\d{6}$/.test(otp)) return fail(res, 400, "Mã OTP phải gồm 6 chữ số.");
    if (!validatePassword(newPassword)) return fail(res, 400, "Mật khẩu mới phải có ít nhất 6 ký tự.");
    if (newPassword !== confirmPassword) return fail(res, 400, "Mật khẩu xác nhận không khớp.");

    const updated = await authService.resetPasswordWithOtp(email, otp, newPassword);
    if (!updated) return fail(res, 400, "Mã xác nhận không đúng hoặc đã hết hạn.");

    return ok(res, { message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại." });
  }
}

module.exports = new AuthController();
