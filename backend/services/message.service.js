const prisma = require("../lib/prisma");
const { userSelect } = require("../utils/constants");

class MessageService {
  async getThreads(userId, skip, take) {
    const where = { OR: [{ studentId: userId }, { landlordId: userId }] };
    const [threads, total] = await Promise.all([
      prisma.messageThread.findMany({
        where,
        include: { student: { select: userSelect }, landlord: { select: userSelect }, post: true, room: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
        orderBy: { updatedAt: "desc" },
        skip,
        take
      }),
      prisma.messageThread.count({ where })
    ]);
    return { threads, total };
  }

  async getThreadForUser(threadId, userId) {
    return prisma.messageThread.findFirst({
      where: { id: threadId, OR: [{ studentId: userId }, { landlordId: userId }] },
      include: { student: { select: userSelect }, landlord: { select: userSelect }, post: true, room: true }
    });
  }

  async getMessages(threadId, skip, take) {
    const where = { threadId };
    const [messages, total] = await Promise.all([
      prisma.message.findMany({ where, include: { sender: { select: userSelect } }, orderBy: { createdAt: "asc" }, skip, take }),
      prisma.message.count({ where })
    ]);
    return { messages, total };
  }

  async markMessagesAsRead(threadId, userId) {
    return prisma.message.updateMany({ where: { threadId, senderId: { not: userId }, readAt: null }, data: { readAt: new Date() } });
  }

  async createThreadAndMessage(studentId, landlordId, postId, roomId, content, senderId) {
    const existing = await prisma.messageThread.findFirst({ where: { studentId, landlordId, postId, roomId } });
    const thread = await prisma.$transaction(async (tx) => {
      const active = existing || await tx.messageThread.create({ data: { studentId, landlordId, postId, roomId } });
      if (content) {
        await tx.message.create({ data: { threadId: active.id, senderId, content } });
        await tx.messageThread.update({ where: { id: active.id }, data: { updatedAt: new Date() } });
      }
      return tx.messageThread.findUnique({ where: { id: active.id }, include: { student: { select: userSelect }, landlord: { select: userSelect }, post: true, room: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } } });
    });
    return { existing: !!existing, thread };
  }

  async createMessage(threadId, senderId, receiverId, content) {
    return prisma.$transaction(async (tx) => {
      const created = await tx.message.create({ data: { threadId, senderId, content }, include: { sender: { select: userSelect } } });
      await tx.messageThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });
      await tx.notification.create({ data: { userId: receiverId, type: "MESSAGE", title: "Bạn có tin nhắn mới", content } });
      return created;
    });
  }
}

module.exports = new MessageService();
