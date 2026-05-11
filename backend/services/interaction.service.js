const prisma = require("../lib/prisma");
const { userSelect } = require("../utils/constants");

class InteractionService {
  // CONTACT SUPPORT
  async createContactRequest({ fullName, contact, content, senderRole = "GUEST" }) {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { id: true }
    });
    if (!admins.length) return 0;

    const title = `[Lien he ho tro] ${fullName}`;
    const body = `Nguoi gui: ${fullName} (${senderRole}) | Lien he: ${contact} | Noi dung: ${content}`;
    const result = await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        type: "SUPPORT_CONTACT",
        title,
        content: body
      }))
    });

    return result.count || 0;
  }

  // REPORTS
  async getPostForReport(postId) {
    return prisma.post.findFirst({ where: { id: postId, status: { not: "DELETED" } } });
  }

  async createReport(reporterId, postId, reason, content) {
    return prisma.report.create({ data: { reporterId, postId, reason, content } });
  }

  async getMyReports(reporterId, skip, take) {
    const where = { reporterId };
    const [reports, total] = await Promise.all([
      prisma.report.findMany({ where, include: { post: { include: { room: true } } }, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.report.count({ where })
    ]);
    return { reports, total };
  }

  // FAVORITES
  async getRoomForFavorite(roomId) {
    return prisma.room.findFirst({ where: { id: roomId, status: "AVAILABLE", posts: { some: { status: "APPROVED" } } } });
  }

  async toggleFavorite(userId, roomId) {
    return prisma.favorite.upsert({
      where: { userId_roomId: { userId, roomId } },
      update: {},
      create: { userId, roomId }
    });
  }

  async getFavorites(userId, skip, take) {
    const where = { userId };
    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({ where, include: { room: { include: { images: true, posts: { where: { status: "APPROVED" }, take: 1 } } } }, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.favorite.count({ where })
    ]);
    return { favorites, total };
  }

  async deleteFavorite(userId, roomId) {
    return prisma.favorite.deleteMany({ where: { userId, roomId } });
  }

  // REVIEWS
  async getRoomForReview(roomId) {
    return prisma.room.findFirst({ where: { id: roomId, posts: { some: { status: "APPROVED" } } } });
  }

  async createReview(studentId, roomId, rating, content) {
    return prisma.review.upsert({
      where: { studentId_roomId: { studentId, roomId } },
      update: { rating, content },
      create: { studentId, roomId, rating, content },
      include: { student: { select: userSelect } }
    });
  }

  async getReviewsByRoom(roomId, skip, take) {
    const where = { roomId };
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({ where, include: { student: { select: userSelect } }, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.review.count({ where })
    ]);
    return { reviews, total };
  }

  // NOTIFICATIONS
  async getNotifications(userId, skip, take) {
    const where = { userId };
    const [notifications, total, unread] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } })
    ]);
    return { notifications, total, unread };
  }

  async markNotificationAsRead(id, userId) {
    return prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  }
}

module.exports = new InteractionService();
