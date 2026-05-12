const prisma = require("../lib/prisma");
const { hashPassword, comparePassword } = require("../lib/auth");

function otpExpiryDate() {
  const minutes = Number(process.env.RESET_OTP_EXPIRES_MINUTES || 5);
  return new Date(Date.now() + Math.max(minutes, 1) * 60 * 1000);
}

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

  createOtpCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  async createPasswordResetOtp(user) {
    const otp = this.createOtpCode();
    const otpHash = await hashPassword(otp);

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true }
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        email: user.email,
        otpHash,
        expiresAt: otpExpiryDate()
      }
    });

    return otp;
  }

  async getValidPasswordResetToken(email, otp) {
    if (!email || !otp) return null;

    const candidates = await prisma.passwordResetToken.findMany({
      where: {
        email,
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: "desc" },
      take: 5
    });

    for (const token of candidates) {
      if (await comparePassword(otp, token.otpHash)) return token;
    }

    return null;
  }

  async verifyPasswordResetOtp(email, otp) {
    return Boolean(await this.getValidPasswordResetToken(email, otp));
  }

  async resetPasswordWithOtp(email, otp, newPassword) {
    const token = await this.getValidPasswordResetToken(email, otp);
    if (!token) return false;

    const passwordHash = await hashPassword(newPassword);
    await prisma.$transaction([
      prisma.user.update({ where: { id: token.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: token.id }, data: { used: true } })
    ]);

    return true;
  }

  async cleanupExpiredPasswordResetTokens() {
    return prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { used: true },
          { expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
        ]
      }
    });
  }
}

module.exports = new AuthService();
