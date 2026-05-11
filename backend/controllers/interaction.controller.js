const interactionService = require("../services/interaction.service");
const { ok, fail, clean, opt, pageInfo, intNum } = require("../utils/helpers");

class InteractionController {
  // CONTACT SUPPORT
  async createContactRequest(req, res) {
    const fullName = clean(req.body.fullName || req.body.name || req.body.hoTen);
    const contact = clean(req.body.contact || req.body.emailOrPhone || req.body.lienHe);
    const content = clean(req.body.content || req.body.message || req.body.noiDung);
    const senderRole = req.user?.role || "GUEST";

    if (!fullName || !contact || !content) {
      return fail(res, 400, "Vui long nhap day du ho ten, thong tin lien he va noi dung can ho tro.");
    }

    const delivered = await interactionService.createContactRequest({ fullName, contact, content, senderRole });
    return ok(res, { message: "Gui lien he thanh cong. Admin se phan hoi som.", delivered }, 201);
  }

  // REPORTS
  async createReport(req, res) {
    const postId = clean(req.body.postId || req.body.maBaiDang);
    const reason = clean(req.body.reason || req.body.lyDo);
    const content = opt(req.body.content || req.body.noiDung);
    
    if (!postId || !reason) return fail(res, 400, "Vui lòng chọn bài đăng và nhập lý do báo cáo.");
    const post = await interactionService.getPostForReport(postId);
    if (!post) return fail(res, 404, "Bài đăng không tồn tại hoặc đã bị xóa.");
    
    const report = await interactionService.createReport(req.user.id, postId, reason, content);
    return ok(res, { message: "Gửi báo cáo vi phạm thành công.", report }, 201);
  }

  async getMyReports(req, res) {
    const { page, limit, skip, take } = pageInfo(req.query);
    const { reports, total } = await interactionService.getMyReports(req.user.id, skip, take);
    return ok(res, { reports, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  }

  // FAVORITES
  async getFavorites(req, res) {
    const { page, limit, skip, take } = pageInfo(req.query);
    const { favorites, total } = await interactionService.getFavorites(req.user.id, skip, take);
    return ok(res, { favorites, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  }

  async addFavorite(req, res) {
    const room = await interactionService.getRoomForFavorite(req.params.roomId);
    if (!room) return fail(res, 404, "Phòng trọ không tồn tại hoặc chưa được hiển thị công khai.");
    
    const favorite = await interactionService.toggleFavorite(req.user.id, room.id);
    return ok(res, { message: "Đã lưu phòng trọ yêu thích.", favorite }, 201);
  }

  async removeFavorite(req, res) {
    await interactionService.deleteFavorite(req.user.id, req.params.roomId);
    return ok(res, { message: "Đã bỏ lưu phòng trọ yêu thích." });
  }

  // REVIEWS
  async getReviews(req, res) {
    const { page, limit, skip, take } = pageInfo(req.query);
    const { reviews, total } = await interactionService.getReviewsByRoom(req.params.roomId, skip, take);
    return ok(res, { reviews, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  }

  async createReview(req, res) {
    const rating = intNum(req.body.rating || req.body.danhGia);
    const content = opt(req.body.content || req.body.noiDung);
    
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail(res, 400, "Điểm đánh giá phải từ 1 đến 5.");
    const room = await interactionService.getRoomForReview(req.params.roomId);
    if (!room) return fail(res, 404, "Phòng trọ không tồn tại hoặc chưa được hiển thị công khai.");
    
    const review = await interactionService.createReview(req.user.id, room.id, rating, content);
    return ok(res, { message: "Gửi đánh giá phòng trọ thành công.", review }, 201);
  }

  // NOTIFICATIONS
  async getNotifications(req, res) {
    const { page, limit, skip, take } = pageInfo(req.query);
    const { notifications, total, unread } = await interactionService.getNotifications(req.user.id, skip, take);
    return ok(res, { notifications, unread, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  }

  async markNotificationRead(req, res) {
    await interactionService.markNotificationAsRead(req.params.id, req.user.id);
    return ok(res, { message: "Đã đánh dấu thông báo là đã đọc." });
  }
}

module.exports = new InteractionController();
