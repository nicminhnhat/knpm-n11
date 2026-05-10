const prisma = require("../lib/prisma");
const { userSelect, postInclude } = require("../utils/constants");

class AdminService {
  async getDashboardStats() {
    const [users, rooms, posts, pendingPosts, reports, pendingReports, verifications] = await Promise.all([
      prisma.user.count(),
      prisma.room.count(),
      prisma.post.count({ where: { status: { not: "DELETED" } } }),
      prisma.post.count({ where: { status: "PENDING" } }),
      prisma.report.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.verificationProfile.count({ where: { status: "PENDING" } })
    ]);
    return { users, rooms, posts, pendingPosts, reports, pendingReports, verifications };
  }

  async getUsers(where, skip, take) {
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, select: { ...userSelect, _count: { select: { rooms: true, posts: true, reports: true } } }, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.user.count({ where })
    ]);
    return { users, total };
  }

  async getUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: { ...userSelect, rooms: { take: 5, orderBy: { createdAt: "desc" } }, posts: { take: 5, orderBy: { createdAt: "desc" } }, accountLogs: { take: 10, orderBy: { createdAt: "desc" } }, verificationProfiles: { take: 5, orderBy: { createdAt: "desc" } } }
    });
  }

  async lockUser(adminId, userId, reason) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({ where: { id: userId }, data: { status: "LOCKED", lockReason: reason } });
      await tx.accountLog.create({ data: { userId: updated.id, adminId, action: "LOCK_ACCOUNT", reason } });
      await tx.notification.create({ data: { userId: updated.id, type: "ACCOUNT_LOCKED", title: "Tài khoản đã bị khóa", content: reason } });
      return updated;
    });
  }

  async unlockUser(adminId, userId) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({ where: { id: userId }, data: { status: "ACTIVE", lockReason: null } });
      await tx.accountLog.create({ data: { userId: updated.id, adminId, action: "UNLOCK_ACCOUNT" } });
      await tx.notification.create({ data: { userId: updated.id, type: "ACCOUNT_UNLOCKED", title: "Tài khoản đã được mở khóa", content: "Bạn có thể tiếp tục sử dụng hệ thống." } });
      return updated;
    });
  }

  async getPosts(where, skip, take) {
    const [posts, total] = await Promise.all([
      prisma.post.findMany({ where, include: postInclude, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.post.count({ where })
    ]);
    return { posts, total };
  }

  async getPostById(id) {
    return prisma.post.findUnique({ where: { id }, include: postInclude });
  }

  async moderatePost(id, data, title, content) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.post.update({ where: { id }, data, include: postInclude });
      await tx.notification.create({ data: { userId: result.landlordId, type: data.status === "APPROVED" ? "POST_APPROVED" : "POST_REJECTED", title, content } });
      return result;
    });
  }

  async getVerifications(where, skip, take) {
    const [requests, total] = await Promise.all([
      prisma.verificationProfile.findMany({ where, include: { landlord: { select: userSelect } }, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.verificationProfile.count({ where })
    ]);
    return { requests, total };
  }

  async getVerificationById(id) {
    return prisma.verificationProfile.findUnique({ where: { id } });
  }

  async moderateVerification(id, landlordId, status, userVerificationStatus, title, content, reason) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.verificationProfile.update({ where: { id }, data: { status, rejectionReason: status === "REJECTED" ? reason : null, reviewedAt: new Date() }, include: { landlord: { select: userSelect } } });
      await tx.user.update({ where: { id: landlordId }, data: { verificationStatus: userVerificationStatus } });
      await tx.notification.create({ data: { userId: landlordId, type: status === "VERIFIED" ? "VERIFICATION_APPROVED" : "VERIFICATION_REJECTED", title, content } });
      return result;
    });
  }

  async getReports(where, skip, take) {
    const [reports, total] = await Promise.all([
      prisma.report.findMany({ where, include: { reporter: { select: userSelect }, post: { include: postInclude } }, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.report.count({ where })
    ]);
    return { reports, total };
  }

  async getReportById(id) {
    return prisma.report.findUnique({ where: { id }, include: { post: true } });
  }

  async resolveReport(adminId, reportId, status, adminNote, hidePost, lockLandlord, postId, landlordId, reporterId) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.report.update({ where: { id: reportId }, data: { status, adminNote: adminNote || null, resolvedAt: new Date() }, include: { reporter: { select: userSelect }, post: { include: postInclude } } });
      if (status === "RESOLVED" && hidePost) await tx.post.update({ where: { id: postId }, data: { status: "HIDDEN", hiddenAt: new Date() } });
      if (status === "RESOLVED" && lockLandlord) {
        await tx.user.update({ where: { id: landlordId }, data: { status: "LOCKED", lockReason: adminNote || "Vi phạm nội quy hệ thống." } });
        await tx.accountLog.create({ data: { userId: landlordId, adminId, action: "LOCK_ACCOUNT_BY_REPORT", reason: adminNote || "Vi phạm nội quy hệ thống." } });
      }
      await tx.notification.create({ data: { userId: reporterId, type: "REPORT_RESOLVED", title: status === "RESOLVED" ? "Báo cáo đã được xử lý" : "Báo cáo đã bị từ chối", content: adminNote || "Admin đã cập nhật trạng thái báo cáo của bạn." } });
      return result;
    });
  }
}

module.exports = new AdminService();
