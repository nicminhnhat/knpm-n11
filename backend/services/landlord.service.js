const prisma = require("../lib/prisma");
const { postInclude } = require("../utils/constants");

function normalizeImages(images = []) {
  return images
    .filter((img) => img && img.url)
    .map((img, index) => ({ url: img.url, alt: img.alt, sortOrder: img.sortOrder ?? index }));
}

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
        images: { create: normalizeImages(images) }
      },
      include: { images: { orderBy: { sortOrder: "asc" } } }
    });
  }

  async updateRoom(id, data, images) {
    if (Array.isArray(images)) {
      const nextImages = normalizeImages(images);
      return prisma.$transaction(async (tx) => {
        await tx.room.update({ where: { id }, data });
        await tx.roomImage.deleteMany({ where: { roomId: id } });
        if (nextImages.length) {
          await tx.roomImage.createMany({ data: nextImages.map((img, index) => ({ roomId: id, url: img.url, alt: img.alt, sortOrder: img.sortOrder ?? index })) });
        }
        return tx.room.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" } }, posts: true } });
      });
    }

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

  async replaceRoomImages(tx, roomId, images) {
    const nextImages = normalizeImages(images);
    if (!nextImages.length) return;
    await tx.roomImage.deleteMany({ where: { roomId } });
    await tx.roomImage.createMany({ data: nextImages.map((img, index) => ({ roomId, url: img.url, alt: img.alt, sortOrder: img.sortOrder ?? index })) });
  }

  async createPost(landlordId, roomId, title, description, normalizedImages) {
    return prisma.$transaction(async (tx) => {
      await this.replaceRoomImages(tx, roomId, normalizedImages);
      const post = await tx.post.create({ data: { landlordId, roomId, title, description, status: "PENDING" } });
      return tx.post.findUnique({ where: { id: post.id }, include: postInclude });
    });
  }

  async updatePost(id, data, images) {
    if (Array.isArray(images)) {
      return prisma.$transaction(async (tx) => {
        const post = await tx.post.update({ where: { id }, data });
        await this.replaceRoomImages(tx, data.roomId || post.roomId, images);
        return tx.post.findUnique({ where: { id }, include: postInclude });
      });
    }

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
