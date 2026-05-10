const prisma = require("../lib/prisma");
const { postInclude } = require("../utils/constants");

class LandlordService {
  async getRooms(landlordId, skip, take) {
    const where = { landlordId };
    const [rooms, total] = await Promise.all([
      prisma.room.findMany({ where, include: { images: { orderBy: { sortOrder: "asc" } }, posts: true }, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.room.count({ where })
    ]);
    return { rooms, total };
  }

  async getRoomById(id, landlordId) {
    return prisma.room.findFirst({ where: { id, landlordId }, include: { images: { orderBy: { sortOrder: "asc" } }, posts: true } });
  }

  async createRoom(data, landlordId, images) {
    return prisma.room.create({
      data: {
        ...data,
        landlordId,
        images: { create: images.filter((img) => img && img.url).map((img, index) => ({ url: img.url, alt: img.alt, sortOrder: img.sortOrder ?? index })) }
      },
      include: { images: { orderBy: { sortOrder: "asc" } } }
    });
  }

  async updateRoom(id, data) {
    return prisma.room.update({ where: { id }, data, include: { images: true, posts: true } });
  }

  async deleteRoom(id) {
    return prisma.room.delete({ where: { id } });
  }

  async getPosts(landlordId, status, skip, take) {
    const where = { landlordId, ...(["PENDING", "APPROVED", "REJECTED", "HIDDEN", "DELETED"].includes(status) ? { status } : {}) };
    const [posts, total] = await Promise.all([
      prisma.post.findMany({ where, include: postInclude, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.post.count({ where })
    ]);
    return { posts, total };
  }

  async getPostById(id, landlordId) {
    return prisma.post.findFirst({ where: { id, landlordId }, include: postInclude });
  }

  async createPost(landlordId, roomId, title, description, normalizedImages) {
    await Promise.all(normalizedImages.map((img, index) => prisma.roomImage.create({
      data: { roomId, url: img.url, alt: img.alt, sortOrder: index }
    })));
    return prisma.post.create({ data: { landlordId, roomId, title, description, status: "PENDING" }, include: postInclude });
  }

  async updatePost(id, data) {
    return prisma.post.update({ where: { id }, data, include: postInclude });
  }

  async getVerificationRequests(landlordId) {
    return prisma.verificationProfile.findMany({ where: { landlordId }, orderBy: { createdAt: "desc" } });
  }

  async createVerificationRequest(landlordId, data) {
    return prisma.$transaction(async (tx) => {
      const created = await tx.verificationProfile.create({ data: { landlordId, ...data, status: "PENDING" } });
      await tx.user.update({ where: { id: landlordId }, data: { verificationStatus: "PENDING" } });
      return created;
    });
  }
}

module.exports = new LandlordService();
