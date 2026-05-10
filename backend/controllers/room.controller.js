const roomService = require("../services/room.service");
const { ok, fail, pageInfo, publicRoomWhere } = require("../utils/helpers");

class RoomController {
  async getRooms(req, res) {
    const { page, limit, skip, take } = pageInfo(req.query);
    const where = publicRoomWhere(req.query);
    const { rooms, total } = await roomService.getPublicRooms(where, skip, take);
    return ok(res, { rooms, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  }

  async getRoomById(req, res) {
    const room = await roomService.getPublicRoomById(req.params.id);
    if (!room) return fail(res, 404, "Phòng trọ không còn tồn tại hoặc chưa được hiển thị công khai.");
    return ok(res, { room });
  }
}

module.exports = new RoomController();
