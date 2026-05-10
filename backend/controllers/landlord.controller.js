const landlordService = require("../services/landlord.service");
const { ok, fail, pageInfo, clean, opt, roomData, validateRoom, intNum } = require("../utils/helpers");

class LandlordController {
  // ROOMS
  async getRooms(req, res) {
    const { page, limit, skip, take } = pageInfo(req.query);
    const { rooms, total } = await landlordService.getRooms(req.user.id, skip, take);
    return ok(res, { rooms, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  }

  async getRoomById(req, res) {
    const room = await landlordService.getRoomById(req.params.id, req.user.id);
    if (!room) return fail(res, 404, "Không tìm thấy phòng trọ thuộc quyền quản lý của bạn.");
    return ok(res, { room });
  }

  async createRoom(req, res) {
    const data = roomData(req.body);
    const error = validateRoom(data);
    if (error) return fail(res, 400, error);
    const images = Array.isArray(req.body.images) ? req.body.images : [];
    const normalizedImages = images.map((img, index) => ({ url: clean(img.url), alt: opt(img.alt), sortOrder: intNum(img.sortOrder, index) }));
    const room = await landlordService.createRoom(data, req.user.id, normalizedImages);
    return ok(res, { message: "Thêm phòng trọ thành công.", room }, 201);
  }

  async updateRoom(req, res) {
    const current = await landlordService.getRoomById(req.params.id, req.user.id);
    if (!current) return fail(res, 404, "Không tìm thấy phòng trọ thuộc quyền quản lý của bạn.");
    const data = roomData(req.body, current);
    const error = validateRoom(data);
    if (error) return fail(res, 400, error);
    const room = await landlordService.updateRoom(current.id, data);
    return ok(res, { message: "Cập nhật thông tin phòng trọ thành công.", room });
  }

  async updateRoomStatus(req, res) {
    const status = clean(req.body.status || req.body.trangThai).toUpperCase();
    if (!["AVAILABLE", "RENTED", "HIDDEN"].includes(status)) return fail(res, 400, "Trạng thái phòng không hợp lệ.");
    const current = await landlordService.getRoomById(req.params.id, req.user.id);
    if (!current) return fail(res, 404, "Không tìm thấy phòng trọ thuộc quyền quản lý của bạn.");
    const room = await landlordService.updateRoom(current.id, { status });
    return ok(res, { message: "Cập nhật trạng thái phòng trọ thành công.", room });
  }

  async deleteRoom(req, res) {
    const room = await landlordService.getRoomById(req.params.id, req.user.id);
    if (!room) return fail(res, 404, "Không tìm thấy phòng trọ thuộc quyền quản lý của bạn.");
    if (room.status === "RENTED") return fail(res, 400, "Không thể xóa phòng đang có người thuê.");
    await landlordService.deleteRoom(room.id);
    return ok(res, { message: "Xóa phòng trọ thành công." });
  }

  // POSTS
  async getPosts(req, res) {
    const { page, limit, skip, take } = pageInfo(req.query);
    const status = clean(req.query.status || req.query.trangThai).toUpperCase();
    const { posts, total } = await landlordService.getPosts(req.user.id, status, skip, take);
    return ok(res, { posts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  }

  async getPostById(req, res) {
    const post = await landlordService.getPostById(req.params.id, req.user.id);
    if (!post) return fail(res, 404, "Không tìm thấy bài đăng thuộc quyền quản lý của bạn.");
    return ok(res, { post });
  }

  async createPost(req, res) {
    const title = clean(req.body.title || req.body.tieuDe);
    const description = clean(req.body.description || req.body.moTa);
    const roomId = clean(req.body.roomId || req.body.maPhongTro);
    const imageUrl = opt(req.body.imageUrl || req.body.hinhAnh);
    const images = Array.isArray(req.body.images) ? req.body.images : [];
    
    if (!title || title.length < 5) return fail(res, 400, "Tiêu đề bài đăng phải có ít nhất 5 ký tự.");
    if (!description || description.length < 10) return fail(res, 400, "Mô tả bài đăng phải có ít nhất 10 ký tự.");
    if (!roomId) return fail(res, 400, "Vui lòng chọn phòng trọ để tạo bài đăng.");
    if (!imageUrl && !images.some((img) => img && img.url)) return fail(res, 400, "Vui lòng thêm hình ảnh phòng trọ cho bài đăng.");
    
    const room = await landlordService.getRoomById(roomId, req.user.id);
    if (!room) return fail(res, 404, "Không tìm thấy phòng trọ thuộc quyền quản lý của bạn.");

    const normalizedImages = [
      ...(imageUrl ? [{ url: imageUrl, alt: title }] : []),
      ...images.filter((img) => img && img.url).map((img) => ({ url: clean(img.url), alt: opt(img.alt) || title }))
    ];

    const post = await landlordService.createPost(req.user.id, roomId, title, description, normalizedImages);
    return ok(res, { message: "Tạo bài đăng thành công. Bài đăng đang chờ admin kiểm duyệt.", post }, 201);
  }

  async updatePost(req, res) {
    const current = await landlordService.getPostById(req.params.id, req.user.id);
    if (!current || current.status === "DELETED") return fail(res, 404, "Không tìm thấy bài đăng thuộc quyền quản lý của bạn.");
    
    const title = clean(req.body.title || req.body.tieuDe || current.title);
    const description = clean(req.body.description || req.body.moTa || current.description);
    const roomId = clean(req.body.roomId || req.body.maPhongTro || current.roomId);
    
    if (title.length < 5) return fail(res, 400, "Tiêu đề bài đăng phải có ít nhất 5 ký tự.");
    if (description.length < 10) return fail(res, 400, "Mô tả bài đăng phải có ít nhất 10 ký tự.");
    
    const room = await landlordService.getRoomById(roomId, req.user.id);
    if (!room) return fail(res, 404, "Không tìm thấy phòng trọ thuộc quyền quản lý của bạn.");
    
    const post = await landlordService.updatePost(current.id, { title, description, roomId, status: "PENDING", rejectReason: null, hiddenAt: null });
    return ok(res, { message: "Cập nhật bài đăng thành công. Bài đăng chuyển về trạng thái chờ duyệt.", post });
  }

  async hidePost(req, res) {
    const current = await landlordService.getPostById(req.params.id, req.user.id);
    if (!current || current.status === "DELETED") return fail(res, 404, "Không tìm thấy bài đăng thuộc quyền quản lý của bạn.");
    if (current.status === "HIDDEN") return fail(res, 400, "Bài đăng này đang được ẩn rồi.");
    const post = await landlordService.updatePost(current.id, { status: "HIDDEN", hiddenAt: new Date() });
    return ok(res, { message: "Ẩn bài đăng thành công.", post });
  }

  async unhidePost(req, res) {
    const current = await landlordService.getPostById(req.params.id, req.user.id);
    if (!current || current.status === "DELETED") return fail(res, 404, "Không tìm thấy bài đăng thuộc quyền quản lý của bạn.");
    if (current.status !== "HIDDEN") return fail(res, 400, "Chỉ có thể hiện lại bài đăng đang bị ẩn.");

    const nextStatus = current.publishedAt ? "APPROVED" : "PENDING";
    const post = await landlordService.updatePost(current.id, { status: nextStatus, hiddenAt: null, rejectReason: null });
    return ok(res, { message: nextStatus === "APPROVED" ? "Bài đăng đã được hiện lại." : "Bài đăng đã chuyển về trạng thái chờ duyệt.", post });
  }

  async deletePost(req, res) {
    const current = await landlordService.getPostById(req.params.id, req.user.id);
    if (!current || current.status === "DELETED") return fail(res, 404, "Không tìm thấy bài đăng thuộc quyền quản lý của bạn.");
    await landlordService.updatePost(current.id, { status: "DELETED", deletedAt: new Date() });
    return ok(res, { message: "Xóa bài đăng thành công." });
  }

  // VERIFICATION
  async getVerificationProfile(req, res) {
    const requests = await landlordService.getVerificationRequests(req.user.id);
    return ok(res, { verificationStatus: req.user.verificationStatus, requests });
  }

  async createVerificationRequest(req, res) {
    if (req.user.verificationStatus === "VERIFIED") return fail(res, 400, "Tài khoản chủ trọ đã được xác minh.");
    const fullName = clean(req.body.fullName || req.body.hoTen || req.user.fullName);
    const phone = opt(req.body.phone || req.body.soDT || req.user.phone);
    const address = opt(req.body.address || req.body.diaChi);
    const documentType = opt(req.body.documentType || req.body.loaiGiayTo);
    const documentNumber = opt(req.body.documentNumber || req.body.soGiayTo);
    const documentUrl = opt(req.body.documentUrl || req.body.fileGiayTo || req.body.giayTo);
    const note = opt(req.body.note || req.body.ghiChu);
    
    if (!fullName || !documentType || !documentNumber || !documentUrl) return fail(res, 400, "Vui lòng nhập đầy đủ thông tin và giấy tờ xác minh.");
    
    const request = await landlordService.createVerificationRequest(req.user.id, { fullName, phone, address, documentType, documentNumber, documentUrl, note });
    return ok(res, { message: "Gửi yêu cầu xác minh tài khoản thành công.", request }, 201);
  }
}

module.exports = new LandlordController();
