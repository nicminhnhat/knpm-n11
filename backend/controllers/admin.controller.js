const adminService = require("../services/admin.service");
const { toPublicUser } = require("../lib/auth");
const { ok, fail, clean, pageInfo } = require("../utils/helpers");

class AdminController {
  async getDashboardStats(req, res) {
    const stats = await adminService.getDashboardStats();
    return ok(res, { stats });
  }

  async getUsers(req, res) {
    const { page, limit, skip, take } = pageInfo(req.query);
    const q = clean(req.query.q || req.query.keyword || req.query.search);
    const role = clean(req.query.role).toUpperCase();
    const status = clean(req.query.status).toUpperCase();
    
    const and = [];
    if (q) and.push({ OR: [{ fullName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q, mode: "insensitive" } }] });
    if (["STUDENT", "LANDLORD", "ADMIN"].includes(role)) and.push({ role });
    if (["ACTIVE", "LOCKED", "DISABLED"].includes(status)) and.push({ status });
    const where = and.length ? { AND: and } : {};
    
    const { users, total } = await adminService.getUsers(where, skip, take);
    return ok(res, { users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  }

  async getUserById(req, res) {
    const user = await adminService.getUserById(req.params.id);
    if (!user) return fail(res, 404, "Không tìm thấy tài khoản người dùng.");
    return ok(res, { user });
  }

  async lockUser(req, res) {
    const reason = clean(req.body.reason || req.body.lyDo);
    if (!reason) return fail(res, 400, "Vui lòng nhập lý do khóa tài khoản.");
    if (req.params.id === req.user.id) return fail(res, 400, "Admin không thể tự khóa tài khoản đang đăng nhập.");
    
    const user = await adminService.lockUser(req.user.id, req.params.id, reason);
    return ok(res, { message: "Khóa tài khoản thành công.", user: toPublicUser(user) });
  }

  async unlockUser(req, res) {
    const user = await adminService.unlockUser(req.user.id, req.params.id);
    return ok(res, { message: "Mở khóa tài khoản thành công.", user: toPublicUser(user) });
  }

  async getPosts(req, res) {
    const { page, limit, skip, take } = pageInfo(req.query);
    const q = clean(req.query.q || req.query.keyword || req.query.search);
    const status = clean(req.query.status || req.query.trangThai).toUpperCase();
    const district = clean(req.query.district || req.query.khuVuc);
    const landlordId = clean(req.query.landlordId || req.query.maChuTro);
    
    const and = [];
    if (q) and.push({ OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { landlord: { fullName: { contains: q, mode: "insensitive" } } }, { room: { address: { contains: q, mode: "insensitive" } } }] });
    if (["PENDING", "APPROVED", "REJECTED", "HIDDEN", "DELETED"].includes(status)) and.push({ status });
    if (district) and.push({ room: { district: { contains: district, mode: "insensitive" } } });
    if (landlordId) and.push({ landlordId });
    const where = and.length ? { AND: and } : {};
    
    const { posts, total } = await adminService.getPosts(where, skip, take);
    return ok(res, { posts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  }

  async getPostById(req, res) {
    const post = await adminService.getPostById(req.params.id);
    if (!post) return fail(res, 404, "Không tìm thấy bài đăng.");
    return ok(res, { post });
  }

  async moderatePost(req, res) {
    const action = clean(req.body.action || req.body.hanhDong).toLowerCase();
    const reason = clean(req.body.reason || req.body.lyDo || req.body.rejectReason);
    
    const post = await adminService.getPostById(req.params.id);
    if (!post || post.status === "DELETED") return fail(res, 404, "Không tìm thấy bài đăng cần kiểm duyệt.");
    
    let data, title, content;
    if (["approve", "approved", "duyet", "phe_duyet"].includes(action)) {
      data = { status: "APPROVED", rejectReason: null, publishedAt: new Date(), hiddenAt: null };
      title = "Bài đăng đã được phê duyệt";
      content = post.title;
    } else if (["reject", "rejected", "tu_choi"].includes(action)) {
      if (!reason) return fail(res, 400, "Vui lòng nhập lý do từ chối bài đăng.");
      data = { status: "REJECTED", rejectReason: reason };
      title = "Bài đăng đã bị từ chối";
      content = reason;
    } else if (["hide", "an"].includes(action)) {
      data = { status: "HIDDEN", hiddenAt: new Date() };
      title = "Bài đăng đã bị ẩn";
      content = reason || post.title;
    } else {
      return fail(res, 400, "Hành động không hợp lệ. Dùng approve, reject hoặc hide.");
    }
    
    const updated = await adminService.moderatePost(post.id, data, title, content);
    return ok(res, { message: "Cập nhật trạng thái bài đăng thành công.", post: updated });
  }

  async getVerifications(req, res) {
    const { page, limit, skip, take } = pageInfo(req.query);
    const status = clean(req.query.status || req.query.trangThai).toUpperCase();
    const where = ["PENDING", "VERIFIED", "REJECTED", "NOT_SUBMITTED"].includes(status) ? { status } : {};
    
    const { requests, total } = await adminService.getVerifications(where, skip, take);
    return ok(res, { requests, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  }

  async moderateVerification(req, res) {
    const action = clean(req.body.action || req.body.hanhDong).toLowerCase();
    const reason = clean(req.body.reason || req.body.lyDo || req.body.rejectionReason);
    
    const request = await adminService.getVerificationById(req.params.id);
    if (!request) return fail(res, 404, "Không tìm thấy hồ sơ xác minh.");
    
    let status, userVerificationStatus, title, content;
    if (["approve", "approved", "xac_nhan", "duyet"].includes(action)) {
      status = "VERIFIED";
      userVerificationStatus = "VERIFIED";
      title = "Tài khoản chủ trọ đã được xác minh";
      content = "Bạn có thể tạo phòng trọ và bài đăng cho thuê.";
    } else if (["reject", "rejected", "tu_choi"].includes(action)) {
      if (!reason) return fail(res, 400, "Vui lòng nhập lý do từ chối xác minh.");
      status = "REJECTED";
      userVerificationStatus = "REJECTED";
      title = "Hồ sơ xác minh đã bị từ chối";
      content = reason;
    } else {
      return fail(res, 400, "Hành động xác minh không hợp lệ. Dùng approve hoặc reject.");
    }
    
    const updated = await adminService.moderateVerification(request.id, request.landlordId, status, userVerificationStatus, title, content, reason);
    return ok(res, { message: "Cập nhật trạng thái xác minh thành công.", request: updated });
  }

  async getReports(req, res) {
    const { page, limit, skip, take } = pageInfo(req.query);
    const status = clean(req.query.status || req.query.trangThai).toUpperCase();
    const where = ["PENDING", "RESOLVED", "REJECTED"].includes(status) ? { status } : {};
    
    const { reports, total } = await adminService.getReports(where, skip, take);
    return ok(res, { reports, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  }

  async resolveReport(req, res) {
    const action = clean(req.body.action || req.body.hanhDong).toLowerCase();
    const adminNote = clean(req.body.adminNote || req.body.ghiChu || req.body.reason || req.body.lyDo);
    const hidePost = Boolean(req.body.hidePost);
    const lockLandlord = Boolean(req.body.lockLandlord);
    
    const report = await adminService.getReportById(req.params.id);
    if (!report) return fail(res, 404, "Không tìm thấy báo cáo vi phạm.");
    
    const status = ["reject", "rejected", "tu_choi"].includes(action) ? "REJECTED" : "RESOLVED";
    
    const updated = await adminService.resolveReport(req.user.id, report.id, status, adminNote, hidePost, lockLandlord, report.postId, report.post.landlordId, report.reporterId);
    return ok(res, { message: "Cập nhật trạng thái báo cáo thành công.", report: updated });
  }
}

module.exports = new AdminController();
