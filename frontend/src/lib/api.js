const envApiUrl = import.meta.env.VITE_API_URL;
const API_URL = import.meta.env.PROD
  ? envApiUrl
  : (envApiUrl || "http://localhost:3001");

if (import.meta.env.PROD && !API_URL) {
  throw new Error("Missing VITE_API_URL in production build.");
}
export const AUTH_TOKEN_KEY = "knpm_n11_auth_token";

function getAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : { success: response.ok, message: await response.text() };

  if (!response.ok) {
    const error = new Error(data.message || "Yêu cầu không thành công.");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  return parseResponse(response);
}

async function authRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return apiRequest(path, { ...options, headers });
}

async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  return authRequest("/api/uploads", { method: "POST", body: formData });
}

function forgotPassword(email) {
  return apiRequest("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

function verifyResetOtp(email, otp) {
  return apiRequest("/api/auth/verify-reset-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp })
  });
}

function resetPassword(email, otp, newPassword, confirmPassword) {
  return apiRequest("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, otp, newPassword, confirmPassword })
  });
}

function formatVietnameseDate(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function postedDateLabel(value) {
  const formatted = formatVietnameseDate(value);
  if (!formatted) return "Chưa cập nhật ngày đăng";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return `Đăng ngày ${formatted}`;

  const diffMs = Date.now() - date.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  if (diffMs >= 0 && diffMs < oneDayMs) {
    const hours = Math.floor(diffMs / (60 * 60 * 1000));
    const timeLabel = hours <= 0 ? "dưới 1 giờ trước" : `${hours} giờ trước`;
    return `Đăng ${timeLabel} · ${formatted}`;
  }

  return `Đăng ngày ${formatted}`;
}

function asVnd(value) {
  const n = Number(value || 0);
  if (n >= 1000000) return `${(n / 1000000).toLocaleString("vi-VN")} triệu/tháng`;
  return `${n.toLocaleString("vi-VN")} đ/tháng`;
}

function roomImage(room) {
  return room?.images?.[0]?.url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80";
}

function roomTypeLabel(type) {
  const labels = {
    SINGLE: "Phòng đơn",
    SHARED: "Ở ghép",
    DORM: "Ký túc xá",
    APARTMENT: "Căn hộ",
    OTHER: "Khác"
  };
  return labels[type] || "Phòng trọ";
}

function statusLabel(status) {
  const labels = {
    ACTIVE: "Đang hoạt động",
    LOCKED: "Đã khóa",
    DISABLED: "Vô hiệu hóa",
    NOT_SUBMITTED: "Chưa gửi",
    PENDING: "Chờ duyệt",
    VERIFIED: "Đã xác minh",
    REJECTED: "Bị từ chối",
    AVAILABLE: "Còn phòng",
    RENTED: "Hết phòng",
    HIDDEN: "Đã ẩn",
    APPROVED: "Đã duyệt",
    DELETED: "Đã xóa",
    RESOLVED: "Đã xử lý"
  };
  return labels[status] || status || "Không rõ";
}

function normalizeRoom(room) {
  if (!room) return null;
  return {
    ...room,
    image: room.image || roomImage(room),
    category: room.category || roomTypeLabel(room.type),
    priceLabel: room.priceLabel || asVnd(room.price),
    areaLabel: room.areaLabel || `${room.area || 0} m²`,
    statusLabel: statusLabel(room.status),
    createdAt: room.createdAt,
    postCreatedAt: room.posts?.[0]?.createdAt || room.posts?.[0]?.publishedAt || room.createdAt,
    postedDateLabel: postedDateLabel(room.posts?.[0]?.createdAt || room.posts?.[0]?.publishedAt || room.createdAt),
    ownerName: room.landlord?.fullName || room.contactName || "Chủ trọ"
  };
}

export { API_URL, apiRequest, authRequest, asVnd, forgotPassword, formatVietnameseDate, getAuthToken, normalizeRoom, postedDateLabel, resetPassword, roomImage, roomTypeLabel, statusLabel, uploadImage, verifyResetOtp };
