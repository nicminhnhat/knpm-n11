const messageService = require("../services/message.service");
const prisma = require("../lib/prisma"); // Only for quick lookups if not moving to service
const { ok, fail, clean, pageInfo } = require("../utils/helpers");

class MessageController {
  async getThreads(req, res) {
    const { page, limit, skip, take } = pageInfo(req.query);
    const { threads, total } = await messageService.getThreads(req.user.id, skip, take);
    return ok(res, { threads, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  }

  async createThread(req, res) {
    const studentId = req.user.role === "STUDENT" ? req.user.id : clean(req.body.studentId || req.body.maSinhVien);
    let landlordId = req.user.role === "LANDLORD" ? req.user.id : clean(req.body.landlordId || req.body.maChuTro);
    const postId = clean(req.body.postId || req.body.maBaiDang) || null;
    const roomId = clean(req.body.roomId || req.body.maPhongTro) || null;
    const content = clean(req.body.content || req.body.noiDung || req.body.message);

    if (postId && !landlordId) {
      const post = await prisma.post.findUnique({ where: { id: postId } });
      landlordId = post?.landlordId || "";
    }
    if (roomId && !landlordId) {
      const room = await prisma.room.findUnique({ where: { id: roomId } });
      landlordId = room?.landlordId || "";
    }
    if (!studentId || !landlordId) return fail(res, 400, "Thiếu thông tin sinh viên hoặc chủ trọ để tạo cuộc trò chuyện.");
    if (studentId === landlordId) return fail(res, 400, "Không thể nhắn tin với chính mình.");

    const student = await prisma.user.findFirst({ where: { id: studentId, role: "STUDENT" } });
    const landlord = await prisma.user.findFirst({ where: { id: landlordId, role: "LANDLORD" } });
    if (!student || !landlord) return fail(res, 404, "Không tìm thấy sinh viên hoặc chủ trọ phù hợp.");

    const { existing, thread } = await messageService.createThreadAndMessage(studentId, landlordId, postId, roomId, content, req.user.id);
    return ok(res, { message: existing ? "Mở cuộc trò chuyện hiện có." : "Tạo cuộc trò chuyện thành công.", thread }, existing ? 200 : 201);
  }

  async getMessages(req, res) {
    const thread = await messageService.getThreadForUser(req.params.id, req.user.id);
    if (!thread) return fail(res, 404, "Không tìm thấy cuộc trò chuyện.");
    
    const { page, limit, skip, take } = pageInfo(req.query);
    const { messages, total } = await messageService.getMessages(thread.id, skip, take);
    await messageService.markMessagesAsRead(thread.id, req.user.id);
    
    return ok(res, { thread, messages, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  }

  async sendMessage(req, res) {
    const thread = await messageService.getThreadForUser(req.params.id, req.user.id);
    if (!thread) return fail(res, 404, "Không tìm thấy cuộc trò chuyện.");
    if (thread.status === "CLOSED") return fail(res, 400, "Cuộc trò chuyện đã đóng.");
    
    const content = clean(req.body.content || req.body.noiDung || req.body.message);
    if (!content) return fail(res, 400, "Nội dung tin nhắn không được để trống.");
    
    const receiverId = req.user.id === thread.studentId ? thread.landlordId : thread.studentId;
    const message = await messageService.createMessage(thread.id, req.user.id, receiverId, content);
    
    return ok(res, { message: "Gửi tin nhắn thành công.", data: message }, 201);
  }
}

module.exports = new MessageController();
