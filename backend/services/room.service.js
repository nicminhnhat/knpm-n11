const prisma = require("../lib/prisma");
const { roomInclude, userSelect } = require("../utils/constants");

class RoomService {
  async getPublicRooms(where, skip, take) {
    const [rooms, total] = await Promise.all([
      prisma.room.findMany({ where, include: roomInclude, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.room.count({ where })
    ]);
    return { rooms, total };
  }

  async getPublicRoomById(id) {
    return prisma.room.findFirst({
      where: { id, status: "AVAILABLE", posts: { some: { status: "APPROVED" } } },
      include: { ...roomInclude, reviews: { include: { student: { select: userSelect } }, orderBy: { createdAt: "desc" } } }
    });
  }
}

module.exports = new RoomService();
