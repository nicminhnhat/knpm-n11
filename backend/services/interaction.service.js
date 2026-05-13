const prisma = require("../lib/prisma");
const crypto = require("crypto");
const { userSelect } = require("../utils/constants");

function buildSupportContent(meta, message) {
  return `__SUPPORT_META__${JSON.stringify(meta)}\n${message}`;
}

function parseSupportContent(content) {
  const raw = String(content || "");
  if (!raw.startsWith("__SUPPORT_META__")) return { meta: null, message: raw };
  const newLine = raw.indexOf("\n");
  if (newLine < 0) return { meta: null, message: raw };
  const json = raw.slice("__SUPPORT_META__".length, newLine).trim();
  const message = raw.slice(newLine + 1).trim();
  try {
    return { meta: JSON.parse(json), message };
  } catch (_error) {
    return { meta: null, message: raw };
  }
}

function parseLegacySupportBody(message) {
  const text = String(message || "");
  const senderMatch = text.match(/Nguoi gui:\s*([^(|]+)\s*\(([^)]+)\)/i);
  const contactMatch = text.match(/Lien he:\s*([^|]+)/i);
  return {
    senderName: senderMatch?.[1]?.trim() || "Khach",
    senderRole: senderMatch?.[2]?.trim() || "GUEST",
    senderContact: contactMatch?.[1]?.trim() || ""
  };
}

class InteractionService {
  // CONTACT SUPPORT
  async createContactRequest({ fullName, contact, content, senderRole = "GUEST", senderUserId = null }) {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { id: true }
    });
    if (!admins.length) return 0;

    let resolvedSenderUserId = senderUserId;
    if (!resolvedSenderUserId && contact) {
      const matchedUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: contact, mode: "insensitive" } },
            { phone: contact }
          ]
        },
        select: { id: true, role: true }
      });
      if (matchedUser) {
        resolvedSenderUserId = matchedUser.id;
        senderRole = matchedUser.role || senderRole;
      }
    }

    const conversationId = crypto.randomUUID();
    const title = `[Lien he ho tro] ${fullName}`;
    const body = `Nguoi gui: ${fullName} (${senderRole}) | Lien he: ${contact} | Noi dung: ${content}`;
    const adminRows = admins.map((admin) => ({
      userId: admin.id,
      type: "SUPPORT_CONTACT",
      title,
      content: buildSupportContent({
        conversationId,
        senderName: fullName,
        senderRole,
        senderContact: contact,
        senderUserId: resolvedSenderUserId,
        targetUserId: resolvedSenderUserId || null
      }, body)
    }));

    const userRows = resolvedSenderUserId ? [{
      userId: resolvedSenderUserId,
      type: "SUPPORT_CONTACT",
      title: "[Lien he ho tro] Yeu cau da duoc gui",
      content: buildSupportContent({
        conversationId,
        senderName: fullName,
        senderRole,
        senderContact: contact,
        senderUserId: resolvedSenderUserId,
        targetUserId: admins[0].id
      }, "Yeu cau ho tro cua ban da duoc gui den quan tri vien. Ban co the tiep tuc tra loi tai muc Thong bao.")
    }] : [];

    const result = await prisma.notification.createMany({
      data: [...adminRows, ...userRows]
    });

    return result.count || 0;
  }

  async replySupportNotification(notificationId, userId, replyContent) {
    const notification = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
    if (!notification) return { error: "not_found" };

    const parsed = parseSupportContent(notification.content);
    const fallback = parseLegacySupportBody(parsed.message);
    const meta = parsed.meta || {
      conversationId: `legacy-${notification.id}`,
      senderName: fallback.senderName,
      senderRole: fallback.senderRole,
      senderContact: fallback.senderContact,
      senderUserId: null,
      targetUserId: null
    };

    const receiverId = meta.targetUserId;

    const sender = await prisma.user.findUnique({ where: { id: userId }, select: userSelect });
    if (!sender) return { error: "sender_not_found" };

    const senderLabel = sender.fullName || "Nguoi dung";
    const title = `[Phan hoi ho tro] ${senderLabel}`;
    const body = `${senderLabel} (${sender.role}) phan hoi: ${replyContent}`;

    if (!receiverId || receiverId === userId) {
      await prisma.notification.create({
        data: {
          userId,
          type: "SUPPORT_REPLY_INTERNAL",
          title: "[Phan hoi ho tro] Da ghi nhan phan hoi cho khach",
          content: buildSupportContent(
            { ...meta, targetUserId: null },
            `${body}${meta.senderContact ? ` | Lien he khach: ${meta.senderContact}` : ""}`
          )
        }
      });
      return { success: true, internalOnly: true };
    }

    const nextMetaForReceiver = { ...meta, targetUserId: userId };
    const nextMetaForSender = { ...meta, targetUserId: receiverId };

    await prisma.notification.createMany({
      data: [
        { userId: receiverId, type: "SUPPORT_REPLY", title, content: buildSupportContent(nextMetaForReceiver, body) },
        { userId, type: "SUPPORT_REPLY", title: "[Phan hoi ho tro] Ban da gui phan hoi", content: buildSupportContent(nextMetaForSender, `Ban vua gui: ${replyContent}`) }
      ]
    });

    return { success: true };
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
