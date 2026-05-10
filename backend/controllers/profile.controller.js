const profileService = require("../services/profile.service");
const { toPublicUser, comparePassword } = require("../lib/auth");
const { ok, fail, clean, opt, emailOf, isEmail, validatePassword } = require("../utils/helpers");

class ProfileController {
  getProfile(req, res) {
    return ok(res, { user: toPublicUser(req.user) });
  }

  async updateProfile(req, res) {
    const fullName = clean(req.body.fullName || req.body.hoTen || req.user.fullName);
    const email = req.body.email === undefined ? req.user.email : emailOf(req.body.email);
    const phone = req.body.phone === undefined && req.body.soDT === undefined ? req.user.phone : opt(req.body.phone || req.body.soDT);
    const avatarUrl = req.body.avatarUrl === undefined ? req.user.avatarUrl : opt(req.body.avatarUrl);

    if (!fullName || fullName.length < 2) return fail(res, 400, "Họ tên phải có ít nhất 2 ký tự.");
    if (!isEmail(email)) return fail(res, 400, "Email không hợp lệ.");

    const duplicate = await profileService.findDuplicateUser(req.user.id, email, phone);
    if (duplicate) return fail(res, 409, "Email hoặc số điện thoại đã được sử dụng.");

    const user = await profileService.updateUserProfile(req.user.id, { fullName, email, phone, avatarUrl });
    return ok(res, { message: "Cập nhật thông tin cá nhân thành công.", user: toPublicUser(user) });
  }

  async changePassword(req, res) {
    const currentPassword = typeof req.body.currentPassword === "string" ? req.body.currentPassword : "";
    const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : "";
    const confirmPassword = typeof req.body.confirmPassword === "string" ? req.body.confirmPassword : newPassword;
    
    if (!currentPassword || !(await comparePassword(currentPassword, req.user.passwordHash))) return fail(res, 400, "Mật khẩu hiện tại không đúng.");
    if (!validatePassword(newPassword)) return fail(res, 400, "Mật khẩu mới phải có ít nhất 6 ký tự.");
    if (newPassword !== confirmPassword) return fail(res, 400, "Mật khẩu xác nhận không khớp.");
    
    await profileService.updatePassword(req.user.id, newPassword);
    return ok(res, { message: "Thay đổi mật khẩu thành công." });
  }
}

module.exports = new ProfileController();
