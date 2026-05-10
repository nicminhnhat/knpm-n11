const prisma = require("../lib/prisma");
const { hashPassword, comparePassword } = require("../lib/auth");

const resetOtps = new Map();

class AuthService {
  async findUserByEmailOrPhone(email, phone) {
    const OR = [{ email }];
    if (phone) OR.push({ phone });
    return prisma.user.findFirst({ where: { OR } });
  }

  async findUserByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  }

  async createUser(data) {
    data.passwordHash = await hashPassword(data.password);
    delete data.password;
    return prisma.user.create({ data });
  }

  async checkPassword(password, passwordHash) {
    return comparePassword(password, passwordHash);
  }

  async updatePassword(email, newPassword) {
    const passwordHash = await hashPassword(newPassword);
    return prisma.user.update({ where: { email }, data: { passwordHash } });
  }

  createOtp(email) {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    resetOtps.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
    return otp;
  }

  verifyOtp(email, otp) {
    const info = resetOtps.get(email);
    if (!info || info.otp !== otp || info.expiresAt < Date.now()) return false;
    return true;
  }

  deleteOtp(email) {
    resetOtps.delete(email);
  }
}

module.exports = new AuthService();
