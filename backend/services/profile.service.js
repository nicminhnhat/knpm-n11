const prisma = require("../lib/prisma");
const { hashPassword } = require("../lib/auth");

class ProfileService {
  async findDuplicateUser(userId, email, phone) {
    const OR = [{ email }];
    if (phone) OR.push({ phone });
    return prisma.user.findFirst({ where: { id: { not: userId }, OR } });
  }

  async updateUserProfile(userId, data) {
    return prisma.user.update({ where: { id: userId }, data });
  }

  async updatePassword(userId, newPassword) {
    const passwordHash = await hashPassword(newPassword);
    return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }
}

module.exports = new ProfileService();
