const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const ok = (res, data = {}, status = 200) => res.status(status).json({ success: true, ...data });
const fail = (res, status, message, extra = {}) => res.status(status).json({ success: false, message, ...extra });
const clean = (v) => (typeof v === "string" ? v.trim() : "");
const opt = (v) => clean(v) || null;
const emailOf = (v) => clean(v).toLowerCase();
const isEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const num = (v, fallback = undefined) => {
  if (v === undefined || v === null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const intNum = (v, fallback = undefined) => {
  if (v === undefined || v === null || v === "") return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};
const pageInfo = (query) => {
  const page = Math.max(intNum(query.page, 1), 1);
  const limit = Math.min(Math.max(intNum(query.limit, 12), 1), 50);
  return { page, limit, skip: (page - 1) * limit, take: limit };
};
const amenitiesOf = (v) => {
  if (Array.isArray(v)) return v.map(clean).filter(Boolean);
  if (typeof v === "string") return v.split(",").map(clean).filter(Boolean);
  return [];
};

function validatePassword(password) {
  return typeof password === "string" && password.length >= 6;
}

function publicRoomWhere(query) {
  const q = clean(query.q || query.keyword || query.search);
  const minPrice = num(query.minPrice);
  const maxPrice = num(query.maxPrice);
  const minArea = num(query.minArea);
  const maxArea = num(query.maxArea);
  const type = clean(query.type || query.loaiPhong).toUpperCase();
  const district = clean(query.district || query.khuVuc);
  const amenities = amenitiesOf(query.amenities || query.tienIch);
  const and = [{ status: "AVAILABLE" }, { posts: { some: { status: "APPROVED" } } }];

  if (q) {
    and.push({ OR: [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
      { district: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } }
    ] });
  }
  if (minPrice !== undefined || maxPrice !== undefined) and.push({ price: { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) } });
  if (minArea !== undefined || maxArea !== undefined) and.push({ area: { ...(minArea !== undefined ? { gte: minArea } : {}), ...(maxArea !== undefined ? { lte: maxArea } : {}) } });
  if (district) and.push({ district: { contains: district, mode: "insensitive" } });
  if (["SINGLE", "SHARED", "DORM", "APARTMENT", "OTHER"].includes(type)) and.push({ type });
  for (const amenity of amenities) and.push({ amenities: { has: amenity } });
  return { AND: and };
}

function roomData(body, current = {}) {
  return {
    title: clean(body.title || body.tieuDe || current.title),
    description: clean(body.description || body.moTaPhongTro || body.moTa || current.description),
    address: clean(body.address || body.diaChi || current.address),
    ward: body.ward === undefined ? current.ward : opt(body.ward),
    district: body.district === undefined && body.khuVuc === undefined ? current.district : opt(body.district || body.khuVuc),
    city: clean(body.city || current.city || "Huế"),
    price: num(body.price ?? body.giaPhongTro, current.price),
    area: num(body.area ?? body.dienTich, current.area),
    type: clean(body.type || body.loaiPhong || current.type || "SINGLE").toUpperCase(),
    status: clean(body.status || body.trangThai || current.status || "AVAILABLE").toUpperCase(),
    maxOccupants: intNum(body.maxOccupants, current.maxOccupants),
    electricityPrice: num(body.electricityPrice, current.electricityPrice),
    waterPrice: num(body.waterPrice, current.waterPrice),
    internetPrice: num(body.internetPrice, current.internetPrice),
    deposit: num(body.deposit, current.deposit),
    latitude: num(body.latitude, current.latitude),
    longitude: num(body.longitude, current.longitude),
    amenities: body.amenities === undefined && body.tienIch === undefined ? current.amenities || [] : amenitiesOf(body.amenities || body.tienIch),
    contactName: body.contactName === undefined ? current.contactName : opt(body.contactName),
    contactPhone: body.contactPhone === undefined && body.soDTLienHe === undefined ? current.contactPhone : opt(body.contactPhone || body.soDTLienHe)
  };
}

function validateRoom(data) {
  if (!data.title || !data.description || !data.address) return "Thiếu tiêu đề, mô tả hoặc địa chỉ phòng trọ.";
  if (!Number.isFinite(Number(data.price)) || Number(data.price) <= 0) return "Giá phòng phải lớn hơn 0.";
  if (!Number.isFinite(Number(data.area)) || Number(data.area) <= 0) return "Diện tích phòng phải lớn hơn 0.";
  if (!["SINGLE", "SHARED", "DORM", "APARTMENT", "OTHER"].includes(data.type)) return "Loại phòng không hợp lệ.";
  if (!["AVAILABLE", "RENTED", "HIDDEN"].includes(data.status)) return "Trạng thái phòng không hợp lệ.";
  return null;
}

module.exports = {
  asyncHandler,
  ok,
  fail,
  clean,
  opt,
  emailOf,
  isEmail,
  num,
  intNum,
  pageInfo,
  amenitiesOf,
  validatePassword,
  publicRoomWhere,
  roomData,
  validateRoom
};
