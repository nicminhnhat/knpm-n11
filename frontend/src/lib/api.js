const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const AUTH_TOKEN_KEY = "knpm_n11_auth_token";

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
    ownerName: room.landlord?.fullName || room.contactName || "Chủ trọ"
  };
}

export { API_URL, AUTH_TOKEN_KEY, apiRequest, authRequest, asVnd, getAuthToken, normalizeRoom, roomImage, roomTypeLabel, statusLabel, uploadImage };
