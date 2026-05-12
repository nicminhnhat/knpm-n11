import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import FeedbackModal from "../components/FeedbackModal.jsx";
import PageIntro from "../components/PageIntro.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { asVnd, authRequest, roomImage, statusLabel, uploadImage } from "../lib/api.js";

function Card({ title, description, children }) {
  return (
    <section className="panel p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[color:var(--ink)]">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Badge({ children }) {
  return <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-bold text-[color:var(--brand)]">{children}</span>;
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`grid content-start gap-2 self-start text-sm font-bold text-[color:var(--ink)] ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function TextInput(props) {
  return <input {...props} className={`input-shell min-h-14 leading-6 ${props.className || ""}`} />;
}

function TextArea(props) {
  return <textarea {...props} className={`input-shell min-h-32 resize-y leading-7 ${props.className || ""}`} />;
}

function Select(props) {
  return <select {...props} className={`input-shell min-h-14 leading-6 ${props.className || ""}`} />;
}

function ImageUploadField({ label, value, onChange, action, previewAlt = "Hình ảnh", className = "" }) {
  const [isUploading, setIsUploading] = useState(false);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      action?.warn("Vui lòng chọn đúng tệp hình ảnh.");
      event.target.value = "";
      return;
    }
    try {
      setIsUploading(true);
      const result = await uploadImage(file);
      onChange(result.url);
    } catch (err) {
      action?.warn(err.message || "Không thể tải hình ảnh lên hệ thống.", "Tải ảnh thất bại");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  return (
    <Field label={label} className={className}>
      <div className="grid gap-3">
        <label className="flex min-h-14 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3.5 text-sm font-extrabold text-[color:var(--brand)] transition hover:border-[color:var(--brand)] hover:bg-[color:var(--accent-soft)]">
          <input accept="image/*" className="sr-only" type="file" onChange={handleFile} />
          {isUploading ? "Đang tải ảnh..." : value ? "Đổi ảnh" : "Chọn ảnh"}
        </label>
        {value ? <img alt={previewAlt} className="h-28 w-full rounded-2xl object-cover sm:h-32" src={value} /> : null}
      </div>
    </Field>
  );
}

function roleLabel(role) {
  const labels = {
    STUDENT: "Sinh viên",
    LANDLORD: "Chủ trọ",
    ADMIN: "Quản trị viên"
  };
  return labels[role] || role;
}

function statLabel(key) {
  const labels = {
    totalUsers: "Người dùng",
    totalStudents: "Sinh viên",
    totalLandlords: "Chủ trọ",
    totalRooms: "Phòng trọ",
    totalPosts: "Bài đăng",
    pendingPosts: "Bài chờ duyệt",
    pendingVerifications: "Hồ sơ chờ duyệt",
    pendingReports: "Báo cáo chờ xử lý"
  };
  return labels[key] || key;
}

function useActionDialog() {
  const [dialog, setDialog] = useState(null);

  function closeDialog() {
    setDialog(null);
  }

  function notify(type, title, message) {
    setDialog({ type, title, message });
  }

  function warn(message, title = "Cần bổ sung thông tin") {
    notify("warning", title, message);
  }

  function confirm(title, message, onConfirm, confirmLabel = "Xác nhận") {
    setDialog({ type: "confirm", title, message, confirmLabel, cancelLabel: "Hủy", onConfirm });
  }

  function requestText({ title, message, defaultValue = "", placeholder = "Nhập nội dung", confirmLabel = "Xác nhận", onSubmit, multiline = false, required = true }) {
    setDialog({ type: "input", title, message, defaultValue, placeholder, confirmLabel, cancelLabel: "Hủy", onSubmit, multiline, required });
  }

  function requestSelect({ title, message, defaultValue = "", options = [], confirmLabel = "Xác nhận", onSubmit }) {
    setDialog({ type: "select", title, message, defaultValue, options, confirmLabel, cancelLabel: "Hủy", onSubmit, required: true });
  }

  async function run(callback, successMessage, onSuccess) {
    try {
      await callback();
      notify("success", "Thành công", successMessage || "Thao tác đã được thực hiện thành công.");
      onSuccess?.();
      return true;
    } catch (err) {
      notify("error", "Không thể thực hiện", err.message || "Thao tác thất bại. Vui lòng thử lại.");
      return false;
    }
  }

  async function confirmAction() {
    const callback = dialog?.onConfirm;
    closeDialog();
    if (callback) await callback();
  }

  async function submitText(value) {
    const callback = dialog?.onSubmit;
    closeDialog();
    if (callback) await callback(value);
  }

  const modal = <FeedbackModal dialog={dialog} onClose={closeDialog} onConfirm={confirmAction} onSubmitText={submitText} />;
  return { confirm, modal, requestText, requestSelect, run, warn };
}

function isBlank(value) {
  return !String(value || "").trim();
}

function validateRoomForm(form) {
  if (isBlank(form.title)) return "Vui lòng nhập tiêu đề phòng trọ.";
  if (isBlank(form.address)) return "Vui lòng nhập địa chỉ phòng trọ.";
  if (isBlank(form.price) || Number(form.price) <= 0) return "Vui lòng nhập giá phòng hợp lệ.";
  if (isBlank(form.area) || Number(form.area) <= 0) return "Vui lòng nhập diện tích phòng hợp lệ.";
  if (isBlank(form.deposit) || Number(form.deposit) < 0) return "Vui lòng nhập tiền cọc cụ thể (>= 0).";
  if (isBlank(form.electricityPrice) || Number(form.electricityPrice) <= 0) return "Vui lòng nhập giá điện cụ thể.";
  if (isBlank(form.waterPrice) || Number(form.waterPrice) <= 0) return "Vui lòng nhập giá nước cụ thể.";
  if (isBlank(form.imageUrl)) return "Vui lòng thêm hình ảnh phòng trọ.";
  if (isBlank(form.description)) return "Vui lòng nhập mô tả phòng trọ.";
  return "";
}

function validatePostForm(form) {
  if (isBlank(form.roomId)) return "Vui lòng chọn phòng trọ cần đăng bài.";
  if (isBlank(form.title)) return "Vui lòng nhập tiêu đề bài đăng.";
  if (String(form.title).trim().length < 5) return "Tiêu đề bài đăng phải có ít nhất 5 ký tự.";
  if (isBlank(form.description)) return "Vui lòng nhập mô tả bài đăng.";
  if (String(form.description).trim().length < 10) return "Mô tả bài đăng phải có ít nhất 10 ký tự.";
  if (isBlank(form.imageUrl)) return "Vui lòng thêm hình ảnh phòng trọ cho bài đăng.";
  return "";
}

function ProfileSection({ refreshUser, user }) {
  const action = useActionDialog();
  const [profile, setProfile] = useState({ fullName: user.fullName || "", email: user.email || "", phone: user.phone || "", avatarUrl: user.avatarUrl || "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    setProfile({ fullName: user.fullName || "", email: user.email || "", phone: user.phone || "", avatarUrl: user.avatarUrl || "" });
  }, [user]);

  return (
    <Card title="Thông tin cá nhân">
      {action.modal}
      <div className="grid gap-6 lg:grid-cols-2">
        <form className="grid gap-4" onSubmit={async (event) => {
          event.preventDefault();
          if (isBlank(profile.fullName) || isBlank(profile.email)) {
            action.warn("Vui lòng nhập họ tên và email.");
            return;
          }
          await action.run(
            () => authRequest("/api/profile", { method: "PUT", body: JSON.stringify(profile) }),
            "Thông tin cá nhân đã được cập nhật.",
            refreshUser
          );
        }}>
          <Field label="Họ tên"><TextInput value={profile.fullName} onChange={(e) => setProfile((v) => ({ ...v, fullName: e.target.value }))} /></Field>
          <Field label="Email"><TextInput type="email" value={profile.email} onChange={(e) => setProfile((v) => ({ ...v, email: e.target.value }))} /></Field>
          <Field label="Số điện thoại"><TextInput value={profile.phone || ""} onChange={(e) => setProfile((v) => ({ ...v, phone: e.target.value }))} /></Field>
          <ImageUploadField label="Ảnh đại diện" value={profile.avatarUrl || ""} onChange={(url) => setProfile((v) => ({ ...v, avatarUrl: url }))} action={action} previewAlt={profile.fullName || "Ảnh đại diện"} />
          <button className="button-primary w-fit" type="submit">Lưu thông tin</button>
        </form>

        <form className="grid gap-4" onSubmit={async (event) => {
          event.preventDefault();
          if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
            action.warn("Vui lòng nhập đầy đủ thông tin đổi mật khẩu.");
            return;
          }
          if (passwords.newPassword !== passwords.confirmPassword) {
            action.warn("Mật khẩu xác nhận không khớp.");
            return;
          }
          const ok = await action.run(
            () => authRequest("/api/profile/change-password", { method: "PUT", body: JSON.stringify(passwords) }),
            "Mật khẩu đã được thay đổi."
          );
          if (ok) setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
        }}>
          <Field label="Mật khẩu hiện tại"><TextInput type="password" value={passwords.currentPassword} onChange={(e) => setPasswords((v) => ({ ...v, currentPassword: e.target.value }))} /></Field>
          <Field label="Mật khẩu mới"><TextInput type="password" value={passwords.newPassword} onChange={(e) => setPasswords((v) => ({ ...v, newPassword: e.target.value }))} /></Field>
          <Field label="Xác nhận mật khẩu mới"><TextInput type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords((v) => ({ ...v, confirmPassword: e.target.value }))} /></Field>
          <button className="button-secondary w-fit" type="submit">Đổi mật khẩu</button>
        </form>
      </div>
    </Card>
  );
}

function StudentSection() {
  const [reports, setReports] = useState([]);

  async function load() {
    const rep = await authRequest("/api/my/reports");
    setReports(rep.reports || []);
  }

  useEffect(() => { load().catch(() => { }); }, []);

  return (
    <Card title="Báo cáo của tôi" description="Theo dõi các báo cáo tin đăng vi phạm đã gửi cho quản trị viên.">
      <div className="grid gap-4">
        {reports.length ? reports.map((report) => (
          <div key={report.id} className="rounded-[1.4rem] border border-[color:var(--line)] bg-white p-4 shadow-[0_8px_24px_rgba(22,50,74,0.05)] sm:p-5">
            <p className="text-xl font-extrabold text-[color:var(--ink)]">{report.reason}</p>
            <p className="mt-1 text-sm text-[color:var(--muted)]">Bài đăng: {report.post?.title || "Không rõ"}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
              <span className={`rounded-full px-3 py-1.5 ${report.status === "RESOLVED" ? "bg-emerald-100 text-emerald-700" : report.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>Trạng thái: {statusLabel(report.status)}</span>
            </div>
            {report.adminNote ? <p className="mt-2 text-sm text-[color:var(--muted)]">Phản hồi: {report.adminNote}</p> : null}
          </div>
        )) : <p className="text-sm text-[color:var(--muted)]">Chưa gửi báo cáo.</p>}
      </div>
    </Card>
  );
}

function ManagementCard({ title, description, to }) {
  return (
    <Link className="panel-soft block p-5 transition hover:-translate-y-1 hover:border-[color:var(--brand)] hover:shadow-[0_18px_45px_rgba(22,50,74,0.10)]" to={to}>
      <p className="text-lg font-extrabold text-[color:var(--ink)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{description}</p>
      <span className="mt-4 inline-flex text-sm font-bold text-[color:var(--brand)]">Mở chức năng →</span>
    </Link>
  );
}

function LandlordVerificationSection() {
  const action = useActionDialog();
  const [verification, setVerification] = useState(null);
  const [verifyForm, setVerifyForm] = useState({ fullName: "", phone: "", address: "", documentType: "CCCD", documentNumber: "", documentUrl: "", note: "" });

  async function load() {
    const response = await authRequest("/api/landlord/verification/me");
    setVerification(response.requests?.[0] || null);
  }

  useEffect(() => { load().catch(() => { }); }, []);

  return (
    <Card title="Xác minh chủ trọ">
      {action.modal}
      {verification ? <div className="mb-5 panel-soft p-4"><div className="flex items-center justify-between"><strong>Hồ sơ gần nhất</strong><Badge>{statusLabel(verification.status)}</Badge></div>{verification.rejectionReason ? <p className="mt-2 text-sm text-red-700">Lý do từ chối: {verification.rejectionReason}</p> : null}</div> : null}
      <form className="grid items-start gap-x-6 gap-y-5 lg:grid-cols-2" onSubmit={async (event) => {
        event.preventDefault();
        if (isBlank(verifyForm.fullName) || isBlank(verifyForm.phone) || isBlank(verifyForm.address) || isBlank(verifyForm.documentNumber) || isBlank(verifyForm.documentUrl)) {
          action.warn("Vui lòng nhập đầy đủ họ tên, số điện thoại, địa chỉ, số giấy tờ và ảnh giấy tờ.");
          return;
        }
        await action.run(
          () => authRequest("/api/landlord/verification/requests", { method: "POST", body: JSON.stringify(verifyForm) }),
          "Hồ sơ xác minh đã được gửi.",
          load
        );
      }}>
        <Field label="Họ tên trên giấy tờ"><TextInput value={verifyForm.fullName} onChange={(e) => setVerifyForm((v) => ({ ...v, fullName: e.target.value }))} /></Field>
        <Field label="Số điện thoại"><TextInput value={verifyForm.phone} onChange={(e) => setVerifyForm((v) => ({ ...v, phone: e.target.value }))} /></Field>
        <Field label="Địa chỉ"><TextInput value={verifyForm.address} onChange={(e) => setVerifyForm((v) => ({ ...v, address: e.target.value }))} /></Field>
        <Field label="Số giấy tờ"><TextInput value={verifyForm.documentNumber} onChange={(e) => setVerifyForm((v) => ({ ...v, documentNumber: e.target.value }))} /></Field>
        <ImageUploadField label="Ảnh giấy tờ" value={verifyForm.documentUrl} onChange={(url) => setVerifyForm((v) => ({ ...v, documentUrl: url }))} action={action} previewAlt="Ảnh giấy tờ xác minh" />
        <Field label="Ghi chú"><TextInput value={verifyForm.note} onChange={(e) => setVerifyForm((v) => ({ ...v, note: e.target.value }))} /></Field>
        <button className="button-primary w-fit lg:col-span-2" type="submit">Gửi xác minh</button>
      </form>
    </Card>
  );
}

function LandlordRoomsSection() {
  const action = useActionDialog();
  const emptyRoomForm = {
    title: "",
    description: "",
    address: "",
    district: "TP Huế",
    price: "",
    area: "",
    type: "SINGLE",
    amenities: "Wifi, chỗ để xe",
    contactPhone: "",
    deposit: "",
    electricityPrice: "",
    waterPrice: "",
    imageUrl: ""
  };
  const [rooms, setRooms] = useState([]);
  const [roomForm, setRoomForm] = useState(emptyRoomForm);
  const [editingRoomId, setEditingRoomId] = useState(null);

  async function load() {
    const response = await authRequest("/api/landlord/rooms");
    setRooms(response.rooms || []);
  }

  useEffect(() => { load().catch(() => { }); }, []);

  function startEditRoom(room) {
    setEditingRoomId(room.id);
    setRoomForm({
      title: room.title || "",
      description: room.description || "",
      address: room.address || "",
      district: room.district || "TP Huế",
      price: String(room.price || ""),
      area: String(room.area || ""),
      type: room.type || "SINGLE",
      amenities: Array.isArray(room.amenities) ? room.amenities.join(", ") : "",
      contactPhone: room.contactPhone || "",
      deposit: room.deposit ?? "",
      electricityPrice: room.electricityPrice ?? "",
      waterPrice: room.waterPrice ?? "",
      imageUrl: roomImage(room)
    });
  }

  function resetRoomForm() {
    setEditingRoomId(null);
    setRoomForm(emptyRoomForm);
  }

  async function submitRoom(event) {
    event.preventDefault();
    const error = validateRoomForm(roomForm);
    if (error) {
      action.warn(error);
      return;
    }
    const payload = {
      ...roomForm,
      price: Number(roomForm.price),
      area: Number(roomForm.area),
      deposit: Number(roomForm.deposit),
      electricityPrice: Number(roomForm.electricityPrice),
      waterPrice: Number(roomForm.waterPrice),
      amenities: roomForm.amenities.split(",").map((x) => x.trim()).filter(Boolean),
      images: [{ url: roomForm.imageUrl, alt: roomForm.title }]
    };
    const ok = await action.run(
      () => authRequest(editingRoomId ? `/api/landlord/rooms/${editingRoomId}` : "/api/landlord/rooms", { method: editingRoomId ? "PUT" : "POST", body: JSON.stringify(payload) }),
      editingRoomId ? "Thông tin phòng trọ đã được cập nhật." : "Phòng trọ đã được thêm vào hệ thống.",
      load
    );
    if (ok) resetRoomForm();
  }

  return (
    <Card title="Quản lý phòng trọ">
      {action.modal}
      <form className="grid items-start gap-x-6 gap-y-5 lg:grid-cols-3" onSubmit={submitRoom}>
        <Field label="Tiêu đề phòng"><TextInput value={roomForm.title} onChange={(e) => setRoomForm((v) => ({ ...v, title: e.target.value }))} /></Field>
        <Field label="Giá thuê"><TextInput type="number" value={roomForm.price} onChange={(e) => setRoomForm((v) => ({ ...v, price: e.target.value }))} /></Field>
        <Field label="Diện tích"><TextInput type="number" value={roomForm.area} onChange={(e) => setRoomForm((v) => ({ ...v, area: e.target.value }))} /></Field>
        <Field label="Tiền cọc"><TextInput type="number" value={roomForm.deposit} onChange={(e) => setRoomForm((v) => ({ ...v, deposit: e.target.value }))} /></Field>
        <Field label="Giá điện (VND/kWh)"><TextInput type="number" value={roomForm.electricityPrice} onChange={(e) => setRoomForm((v) => ({ ...v, electricityPrice: e.target.value }))} /></Field>
        <Field label="Giá nước (VND/m³)"><TextInput type="number" value={roomForm.waterPrice} onChange={(e) => setRoomForm((v) => ({ ...v, waterPrice: e.target.value }))} /></Field>
        <Field label="Địa chỉ"><TextInput value={roomForm.address} onChange={(e) => setRoomForm((v) => ({ ...v, address: e.target.value }))} /></Field>
        <Field label="Khu vực"><TextInput value={roomForm.district} onChange={(e) => setRoomForm((v) => ({ ...v, district: e.target.value }))} /></Field>
        <Field label="Loại phòng"><Select value={roomForm.type} onChange={(e) => setRoomForm((v) => ({ ...v, type: e.target.value }))}><option value="SINGLE">Phòng đơn</option><option value="SHARED">Ở ghép</option><option value="APARTMENT">Căn hộ</option><option value="OTHER">Khác</option></Select></Field>
        <Field label="Tiện ích"><TextInput value={roomForm.amenities} onChange={(e) => setRoomForm((v) => ({ ...v, amenities: e.target.value }))} /></Field>
        <Field label="Số điện thoại liên hệ"><TextInput value={roomForm.contactPhone} onChange={(e) => setRoomForm((v) => ({ ...v, contactPhone: e.target.value }))} /></Field>
        <ImageUploadField label="Hình ảnh phòng trọ" value={roomForm.imageUrl} onChange={(url) => setRoomForm((v) => ({ ...v, imageUrl: url }))} action={action} previewAlt={roomForm.title || "Hình ảnh phòng trọ"} className="lg:row-span-2" />
        <Field label="Mô tả phòng" className="lg:col-span-2"><TextArea value={roomForm.description} onChange={(e) => setRoomForm((v) => ({ ...v, description: e.target.value }))} /></Field>
        <div className="flex flex-wrap gap-3 lg:col-span-3">
          <button className="button-primary w-fit" type="submit">{editingRoomId ? "Lưu chỉnh sửa" : "Thêm phòng"}</button>
          {editingRoomId ? <button className="button-secondary w-fit" type="button" onClick={resetRoomForm}>Hủy chỉnh sửa</button> : null}
        </div>
      </form>
      <div className="mt-6 grid gap-4">
        {rooms.length ? rooms.map((room) => (
          <div key={room.id} className="rounded-[1.4rem] border border-[color:var(--line)] bg-white p-4 shadow-[0_8px_24px_rgba(22,50,74,0.05)] sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <img alt={room.title} className="h-20 w-28 rounded-2xl object-cover" src={roomImage(room)} />
                <div>
                  <p className="text-xl font-extrabold text-[color:var(--ink)]">{room.title}</p>
                  <p className="text-sm text-[color:var(--muted)]">{room.address}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                    <span className="rounded-full bg-violet-100 px-3 py-1.5 text-violet-700">Giá: {asVnd(room.price)}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">Diện tích: {room.area} m²</span>
                    <span className={`rounded-full px-3 py-1.5 ${room.status === "AVAILABLE" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>Trạng thái: {statusLabel(room.status)}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="button-secondary px-3 py-2 text-xs" type="button" onClick={() => startEditRoom(room)}>Chỉnh sửa</button>
                <button className="button-secondary px-3 py-2 text-xs" type="button" onClick={() => action.requestSelect({
                  title: "Thay đổi trạng thái phòng",
                  message: "Vui lòng chọn trạng thái mới cho phòng trọ này:",
                  defaultValue: room.status === "RENTED" ? "RENTED" : "AVAILABLE",
                  options: [
                    { label: "Còn phòng", value: "AVAILABLE" },
                    { label: "Hết phòng", value: "RENTED" }
                  ],
                  onSubmit: (newStatus) => {
                    if (newStatus !== room.status) {
                      action.run(
                        () => authRequest(`/api/landlord/rooms/${room.id}/status`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) }),
                        "Trạng thái phòng đã được cập nhật.",
                        load
                      );
                    }
                  }
                })}>Đổi trạng thái</button>
                <button className="button-secondary px-3 py-2 text-xs" type="button" onClick={() => action.confirm(
                  "Xóa phòng trọ",
                  `Bạn có chắc chắn muốn xóa phòng “${room.title}”?`,
                  () => action.run(
                    () => authRequest(`/api/landlord/rooms/${room.id}`, { method: "DELETE" }),
                    "Phòng trọ đã được xóa.",
                    load
                  ),
                  "Xóa"
                )}>Xóa</button>
              </div>
            </div>
          </div>
        )) : <p className="text-sm text-[color:var(--muted)]">Chưa có phòng trọ nào.</p>}
      </div>
    </Card>
  );
}

function LandlordPostsSection() {
  const action = useActionDialog();
  const emptyPostForm = { roomId: "", title: "", description: "", imageUrl: "" };
  const [rooms, setRooms] = useState([]);
  const [posts, setPosts] = useState([]);
  const [postForm, setPostForm] = useState(emptyPostForm);
  const [editingPostId, setEditingPostId] = useState(null);

  async function load() {
    const [roomResponse, postResponse] = await Promise.all([authRequest("/api/landlord/rooms"), authRequest("/api/landlord/posts")]);
    const roomList = roomResponse.rooms || [];
    setRooms(roomList);
    setPosts(postResponse.posts || []);
    setPostForm((cur) => ({ ...cur, roomId: cur.roomId || roomList[0]?.id || "" }));
  }

  useEffect(() => { load().catch(() => { }); }, []);

  function resetPostForm() {
    setEditingPostId(null);
    setPostForm({ ...emptyPostForm, roomId: rooms[0]?.id || "" });
  }

  function startEditPost(post) {
    setEditingPostId(post.id);
    setPostForm({ roomId: post.roomId || post.room?.id || rooms[0]?.id || "", title: post.title || "", description: post.description || "", imageUrl: roomImage(post.room) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submitPost(event) {
    event.preventDefault();
    const error = validatePostForm(postForm);
    if (error) {
      action.warn(error);
      return;
    }
    action.confirm(
      editingPostId ? "Xác nhận chỉnh sửa bài đăng" : "Xác nhận đăng bài",
      editingPostId ? "Bài đăng sau khi chỉnh sửa sẽ được chuyển về trạng thái chờ kiểm duyệt." : "Bài đăng sẽ được gửi đến quản trị viên để kiểm duyệt trước khi hiển thị công khai.",
      async () => {
        const ok = await action.run(
          () => authRequest(editingPostId ? `/api/landlord/posts/${editingPostId}` : "/api/landlord/posts", { method: editingPostId ? "PUT" : "POST", body: JSON.stringify(postForm) }),
          editingPostId ? "Bài đăng đã được cập nhật và đang chờ kiểm duyệt." : "Bài đăng đã được tạo và đang chờ kiểm duyệt.",
          load
        );
        if (ok) resetPostForm();
      },
      editingPostId ? "Lưu" : "Đăng bài"
    );
  }

  return (
    <Card title="Quản lý bài đăng">
      {action.modal}
      <form className="grid items-start gap-x-6 gap-y-5 lg:grid-cols-2" onSubmit={submitPost}>
        <Field label="Chọn phòng trọ"><Select value={postForm.roomId} onChange={(e) => setPostForm((v) => ({ ...v, roomId: e.target.value }))}>{rooms.map((room) => <option key={room.id} value={room.id}>{room.title}</option>)}</Select></Field>
        <Field label="Tiêu đề bài đăng"><TextInput value={postForm.title} onChange={(e) => setPostForm((v) => ({ ...v, title: e.target.value }))} /></Field>
        <ImageUploadField label="Hình ảnh bài đăng" value={postForm.imageUrl} onChange={(url) => setPostForm((v) => ({ ...v, imageUrl: url }))} action={action} previewAlt={postForm.title || "Hình ảnh bài đăng"} />
        <Field label="Mô tả bài đăng"><TextArea value={postForm.description} onChange={(e) => setPostForm((v) => ({ ...v, description: e.target.value }))} className="min-h-40" /></Field>
        <div className="flex flex-wrap gap-3 lg:col-span-2">
          <button className="button-primary w-fit" type="submit">{editingPostId ? "Lưu chỉnh sửa bài đăng" : "Tạo bài đăng"}</button>
          {editingPostId ? <button className="button-secondary w-fit" type="button" onClick={resetPostForm}>Hủy chỉnh sửa</button> : null}
        </div>
      </form>
      <div className="mt-6 grid gap-4">
        {posts.length ? posts.map((post) => (
          <div key={post.id} className="rounded-[1.4rem] border border-[color:var(--line)] bg-white p-4 shadow-[0_8px_24px_rgba(22,50,74,0.05)] sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                {post.room ? <img alt={post.title} className="h-20 w-28 rounded-2xl object-cover" src={roomImage(post.room)} /> : null}
                <div>
                  <p className="text-xl font-extrabold text-[color:var(--ink)]">{post.title}</p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">{post.rejectReason || post.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                    <span className={`rounded-full px-3 py-1.5 ${post.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : post.status === "PENDING" ? "bg-amber-100 text-amber-700" : post.status === "HIDDEN" ? "bg-slate-200 text-slate-700" : "bg-rose-100 text-rose-700"}`}>Trạng thái: {statusLabel(post.status)}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="button-secondary px-3 py-2 text-xs" type="button" onClick={() => startEditPost(post)}>Chỉnh sửa</button>
                {post.status === "HIDDEN" ? (
                  <button className="button-secondary px-3 py-2 text-xs" type="button" onClick={() => action.run(
                    () => authRequest(`/api/landlord/posts/${post.id}/unhide`, { method: "PATCH" }),
                    "Bài đăng đã được hiển thị lại.",
                    load
                  )}>Hiện lại</button>
                ) : (
                  <button className="button-secondary px-3 py-2 text-xs" type="button" onClick={() => action.confirm(
                    "Ẩn bài đăng",
                    `Bạn có chắc chắn muốn ẩn bài đăng “${post.title}”?`,
                    () => action.run(
                      () => authRequest(`/api/landlord/posts/${post.id}/hide`, { method: "PATCH" }),
                      "Bài đăng đã được ẩn.",
                      load
                    ),
                    "Ẩn"
                  )}>Ẩn</button>
                )}
                <button className="button-secondary px-3 py-2 text-xs" type="button" onClick={() => action.confirm(
                  "Xóa bài đăng",
                  `Bạn có chắc chắn muốn xóa bài đăng “${post.title}”?`,
                  () => action.run(
                    () => authRequest(`/api/landlord/posts/${post.id}`, { method: "DELETE" }),
                    "Bài đăng đã được xóa.",
                    load
                  ),
                  "Xóa"
                )}>Xóa</button>
              </div>
            </div>
          </div>
        )) : <p className="text-sm text-[color:var(--muted)]">Chưa có bài đăng nào.</p>}
      </div>
    </Card>
  );
}

function LandlordSection({ mode }) {
  if (mode === "verification") return <LandlordVerificationSection />;
  if (mode === "rooms") return <LandlordRoomsSection />;
  if (mode === "posts") return <LandlordPostsSection />;

  return (
    <Card title="Danh mục quản lý" description="Chọn đúng chức năng cần dùng để thao tác trong từng khu vực riêng, giúp dashboard gọn gàng và dễ quản lý hơn.">
      <div className="grid gap-4 md:grid-cols-2">
        <ManagementCard title="Xác minh" description="Gửi và theo dõi hồ sơ xác minh chủ trọ." to="/dashboard/verification" />
        <ManagementCard title="Quản lý trọ" description="Thêm phòng, xem danh sách phòng và cập nhật trạng thái." to="/dashboard/rooms" />
        <ManagementCard title="Quản lý bài đăng" description="Tạo bài đăng, ẩn/hiện và xóa bài đăng cho thuê." to="/dashboard/posts" />
        <ManagementCard title="Nhắn tin" description="Xem danh sách cuộc trò chuyện và phản hồi sinh viên." to="/dashboard/messages" />
      </div>
    </Card>
  );
}

function MessagesSection() {
  const action = useActionDialog();
  const [searchParams] = useSearchParams();
  const [threads, setThreads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const requestedThreadId = searchParams.get("thread");

  async function loadThreads() {
    const response = await authRequest("/api/messages/threads");
    const nextThreads = response.threads || [];
    setThreads(nextThreads);
    return nextThreads;
  }

  async function loadMessages(threadId) {
    const response = await authRequest(`/api/messages/threads/${threadId}/messages`);
    setMessages(response.messages || []);
    return response;
  }

  useEffect(() => {
    loadThreads().then((nextThreads) => {
      if (!nextThreads.length) return;
      const target = nextThreads.find((thread) => thread.id === requestedThreadId) || nextThreads[0];
      setSelected(target);
      loadMessages(target.id).catch(() => { });
    }).catch(() => { });
  }, [requestedThreadId]);

  return (
    <Card title="Tin nhắn" description="Danh sách cuộc trò chuyện và nội dung trao đổi giữa sinh viên với chủ trọ.">
      {action.modal}
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-3">
          {threads.map((thread) => <button key={thread.id} className={`w-full rounded-[1.2rem] border p-4 text-left text-sm transition ${selected?.id === thread.id ? "border-[color:var(--brand)] bg-orange-50" : "border-[color:var(--line)] bg-white hover:border-[color:var(--brand)]"}`} onClick={() => { setSelected(thread); loadMessages(thread.id); }}><strong className="text-base text-[color:var(--ink)]">{thread.room?.title || thread.post?.title || "Cuộc trò chuyện"}</strong><p className="mt-1 text-[color:var(--muted)]">Sinh viên: {thread.student?.fullName} · Chủ trọ: {thread.landlord?.fullName}</p></button>)}
          {!threads.length ? <p className="text-sm text-[color:var(--muted)]">Chưa có cuộc trò chuyện.</p> : null}
        </div>
        <div className="rounded-[1.4rem] border border-[color:var(--line)] bg-white p-4 shadow-[0_8px_24px_rgba(22,50,74,0.05)] sm:p-5">
          {selected ? (
            <>
              <div className="mb-4 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-4">
                <p className="font-bold text-[color:var(--ink)]">{selected.room?.title || selected.post?.title || "Cuộc trò chuyện"}</p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">Trao đổi trực tiếp trong cùng một giao diện.</p>
              </div>
              <div className="max-h-96 space-y-3 overflow-y-auto pr-2">
                {messages.length ? messages.map((msg) => <div key={msg.id} className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-3 text-sm"><strong>{msg.sender?.fullName || "Người gửi"}</strong><p className="mt-1 text-[color:var(--muted)]">{msg.content}</p></div>) : <p className="text-sm text-[color:var(--muted)]">Chưa có tin nhắn trong cuộc trò chuyện này.</p>}
              </div>
              <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={async (event) => {
                event.preventDefault();
                if (isBlank(content)) {
                  action.warn("Vui lòng nhập nội dung tin nhắn.");
                  return;
                }
                try {
                  const nextContent = content;
                  setContent("");
                  await authRequest(`/api/messages/threads/${selected.id}/messages`, { method: "POST", body: JSON.stringify({ content: nextContent }) });
                  await loadMessages(selected.id);
                  await loadThreads();
                } catch (err) {
                  action.warn(err.message || "Không thể gửi tin nhắn. Vui lòng thử lại.", "Không thể gửi tin nhắn");
                }
              }}>
                <input className="input-shell" placeholder="Nhập tin nhắn" value={content} onChange={(e) => setContent(e.target.value)} />
                <button className="button-primary" type="submit">Gửi</button>
              </form>
            </>
          ) : <p className="text-sm text-[color:var(--muted)]">Chọn một cuộc trò chuyện để xem tin nhắn.</p>}
        </div>
      </div>
    </Card>
  );
}

function AdminSection({ mode }) {
  const action = useActionDialog();
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [reports, setReports] = useState([]);

  async function load() {
    const [d, u, p, v, r] = await Promise.all([
      authRequest("/api/admin/dashboard"),
      authRequest("/api/admin/users"),
      authRequest("/api/admin/posts"),
      authRequest("/api/admin/verifications"),
      authRequest("/api/admin/reports")
    ]);
    setDashboard(d.stats || d);
    setUsers(u.users || []);
    setPosts(p.posts || []);
    setVerifications(v.requests || []);
    setReports(r.reports || []);
  }

  useEffect(() => { load().catch(() => { }); }, []);

  function approvePost(post) {
    action.confirm(
      "Duyệt bài đăng",
      `Bạn có chắc chắn muốn phê duyệt bài đăng “${post.title}”?`,
      () => action.run(
        () => authRequest(`/api/admin/posts/${post.id}/moderate`, { method: "PATCH", body: JSON.stringify({ action: "approve" }) }),
        "Bài đăng đã được phê duyệt.",
        async () => {
          await load();
          setExpandedPostId(post.id);
        }
      ),
      "Duyệt"
    );
  }

  function rejectPost(post) {
    action.requestText({
      title: "Từ chối bài đăng",
      message: `Nhập lý do từ chối bài đăng “${post.title}”.`,
      defaultValue: "Thông tin bài đăng chưa hợp lệ.",
      placeholder: "Nhập lý do từ chối",
      confirmLabel: "Từ chối",
      onSubmit: (reason) => action.run(
        () => authRequest(`/api/admin/posts/${post.id}/moderate`, { method: "PATCH", body: JSON.stringify({ action: "reject", reason }) }),
        "Bài đăng đã được từ chối.",
        async () => {
          await load();
          setExpandedPostId(post.id);
        }
      )
    });
  }

  function hidePost(post) {
    action.confirm(
      "Ẩn bài đăng",
      `Bạn có chắc chắn muốn ẩn bài đăng “${post.title}”?`,
      () => action.run(
        () => authRequest(`/api/admin/posts/${post.id}/moderate`, { method: "PATCH", body: JSON.stringify({ action: "hide", reason: "Ẩn bởi quản trị viên" }) }),
        "Bài đăng đã được ẩn.",
        async () => {
          await load();
          setExpandedPostId(post.id);
        }
      ),
      "Ẩn bài"
    );
  }

  function lockUser(u) {
    if (u.role === "ADMIN") {
      action.warn("Không nên khóa tài khoản quản trị viên.");
      return;
    }
    action.requestText({
      title: "Khóa tài khoản",
      message: `Nhập lý do khóa tài khoản “${u.fullName}”.`,
      defaultValue: "Tài khoản vi phạm quy định hệ thống.",
      placeholder: "Nhập lý do khóa tài khoản",
      confirmLabel: "Khóa tài khoản",
      onSubmit: (reason) => action.run(
        () => authRequest(`/api/admin/users/${u.id}/lock`, { method: "PATCH", body: JSON.stringify({ reason }) }),
        "Tài khoản đã được khóa.",
        load
      ),
      multiline: true
    });
  }

  function unlockUser(u) {
    action.confirm(
      "Mở khóa tài khoản",
      `Bạn có chắc chắn muốn mở khóa tài khoản “${u.fullName}”?`,
      () => action.run(
        () => authRequest(`/api/admin/users/${u.id}/unlock`, { method: "PATCH" }),
        "Tài khoản đã được mở khóa.",
        load
      ),
      "Mở khóa"
    );
  }

  function approveVerification(v) {
    action.confirm(
      "Xác minh chủ trọ",
      `Bạn có chắc chắn muốn xác minh hồ sơ của “${v.fullName}”?`,
      () => action.run(
        () => authRequest(`/api/admin/verifications/${v.id}`, { method: "PATCH", body: JSON.stringify({ action: "approve" }) }),
        "Tài khoản chủ trọ đã được xác minh.",
        load
      ),
      "Xác minh"
    );
  }

  function rejectVerification(v) {
    action.requestText({
      title: "Từ chối xác minh",
      message: `Nhập lý do từ chối hồ sơ của “${v.fullName}”.`,
      defaultValue: "Giấy tờ chưa hợp lệ.",
      placeholder: "Nhập lý do từ chối",
      confirmLabel: "Từ chối",
      onSubmit: (reason) => action.run(
        () => authRequest(`/api/admin/verifications/${v.id}`, { method: "PATCH", body: JSON.stringify({ action: "reject", reason }) }),
        "Hồ sơ xác minh đã được từ chối.",
        load
      ),
      multiline: true
    });
  }

  function resolveReport(report) {
    action.requestText({
      title: "Xử lý báo cáo",
      message: `Nhập ghi chú xử lý báo cáo “${report.reason}”.`,
      defaultValue: "Đã kiểm tra và xử lý báo cáo.",
      placeholder: "Nhập ghi chú xử lý",
      confirmLabel: "Xử lý",
      onSubmit: (adminNote) => action.run(
        () => authRequest(`/api/admin/reports/${report.id}/resolve`, { method: "PATCH", body: JSON.stringify({ action: "resolve", adminNote, hidePost: true }) }),
        "Báo cáo đã được xử lý.",
        load
      ),
      multiline: true
    });
  }

  function rejectReport(report) {
    action.requestText({
      title: "Từ chối báo cáo",
      message: `Nhập lý do từ chối báo cáo “${report.reason}”.`,
      defaultValue: "Báo cáo chưa đủ căn cứ để xử lý.",
      placeholder: "Nhập lý do từ chối",
      confirmLabel: "Từ chối",
      onSubmit: (adminNote) => action.run(
        () => authRequest(`/api/admin/reports/${report.id}/resolve`, { method: "PATCH", body: JSON.stringify({ action: "reject", adminNote }) }),
        "Báo cáo đã được từ chối.",
        load
      ),
      multiline: true
    });
  }

  return (
    <div className="space-y-8">
      {action.modal}
      {!mode ? (
        <>
          <Card title="Bảng điều khiển quản trị" description="Tổng quan nhanh tình trạng người dùng, bài đăng, hồ sơ xác minh và báo cáo.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(dashboard || {}).filter(([, v]) => typeof v !== "object").map(([k, v]) => (
                <div key={k} className="metric-card">
                  <p className="text-2xl font-extrabold text-[color:var(--brand)]">{String(v)}</p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">{statLabel(k)}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Danh mục quản lý quản trị viên" description="Chọn từng chức năng riêng để kiểm duyệt và vận hành hệ thống rõ ràng hơn.">
            <div className="grid gap-4 md:grid-cols-2">
              <ManagementCard title="Xác minh tài khoản chủ trọ" description="Kiểm tra giấy tờ và duyệt hồ sơ xác minh." to="/dashboard/admin-verifications" />
              <ManagementCard title="Quản lý bài đăng" description="Duyệt, từ chối hoặc ẩn bài đăng vi phạm." to="/dashboard/admin-posts" />
              <ManagementCard title="Quản lý tài khoản người dùng" description="Xem, khóa hoặc mở khóa tài khoản." to="/dashboard/users" />
              <ManagementCard title="Xử lý báo cáo vi phạm" description="Kiểm tra báo cáo và ghi nhận kết quả xử lý." to="/dashboard/reports" />
            </div>
          </Card>
        </>
      ) : null}

      {mode === "users" ? (
        <Card title="Quản lý tài khoản người dùng" description="Danh sách được trình bày gọn gàng, dễ nhìn hơn cho người mới sử dụng.">
          <div className="grid gap-4">
            {users.map((u) => (
              <div key={u.id} className="rounded-[1.4rem] border border-[color:var(--line)] bg-white p-4 shadow-[0_8px_24px_rgba(22,50,74,0.05)] sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-xl font-extrabold text-[color:var(--ink)]">{u.fullName}</p>
                    <p className="text-sm text-[color:var(--muted)]">{u.email}</p>
                    <div className="flex flex-wrap gap-2 pt-1 text-xs font-bold">
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">Vai trò: {roleLabel(u.role)}</span>
                      <span className={`rounded-full px-3 py-1.5 ${u.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>Trạng thái: {statusLabel(u.status)}</span>
                      <span className={`rounded-full px-3 py-1.5 ${u.verificationStatus === "VERIFIED" ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700"}`}>Xác minh: {statusLabel(u.verificationStatus)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {u.status === "LOCKED" ? (
                      <button className="button-secondary px-4 py-2.5 text-sm" type="button" onClick={() => unlockUser(u)}>Mở khóa</button>
                    ) : (
                      <button className="button-secondary px-4 py-2.5 text-sm" type="button" onClick={() => lockUser(u)}>Khóa</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {mode === "admin-posts" ? (
        <Card title="Quản lý bài đăng" description="Bố cục rõ ràng hơn để quản trị viên dễ duyệt và xử lý bài đăng.">
          <div className="grid gap-4">
            {posts.map((post) => (
              <div key={post.id} className="rounded-[1.4rem] border border-[color:var(--line)] bg-white p-4 shadow-[0_8px_24px_rgba(22,50,74,0.05)] sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-xl font-extrabold text-[color:var(--ink)]">{post.title}</p>
                    <p className="text-sm text-[color:var(--muted)]">{post.landlord?.fullName} · {post.room?.address || "Chưa cập nhật địa chỉ"}</p>
                    <div className="flex flex-wrap gap-2 pt-1 text-xs font-bold">
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">Chủ trọ: {post.landlord?.fullName || "Không rõ"}</span>
                      <span className="rounded-full bg-violet-100 px-3 py-1.5 text-violet-700">Phòng: {post.room?.title || "Không gắn phòng"}</span>
                      <span className={`rounded-full px-3 py-1.5 ${post.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : post.status === "PENDING" ? "bg-amber-100 text-amber-700" : post.status === "HIDDEN" ? "bg-slate-200 text-slate-700" : "bg-rose-100 text-rose-700"}`}>Trạng thái: {statusLabel(post.status)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <button className="button-secondary px-4 py-2.5 text-sm" type="button" onClick={() => setExpandedPostId((current) => current === post.id ? null : post.id)}>
                      {expandedPostId === post.id ? "Thu gọn hồ sơ" : "Xem hồ sơ đăng ký"}
                    </button>
                    <button className="button-secondary px-4 py-2.5 text-sm" type="button" onClick={() => approvePost(post)}>Duyệt</button>
                    <button className="button-secondary px-4 py-2.5 text-sm" type="button" onClick={() => rejectPost(post)}>Từ chối</button>
                    <button className="button-secondary px-4 py-2.5 text-sm" type="button" onClick={() => hidePost(post)}>Ẩn</button>
                  </div>
                </div>
                {expandedPostId === post.id ? (
                  <div className="mt-4 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-4">
                    <p className="text-lg font-extrabold text-[color:var(--ink)]">Thông tin đăng ký chi tiết</p>
                    <div className="mt-3 grid gap-3 text-sm text-[color:var(--muted)] sm:grid-cols-2">
                      <div><strong className="text-[color:var(--ink)]">Chủ trọ:</strong> {post.landlord?.fullName || "Không rõ"}</div>
                      <div><strong className="text-[color:var(--ink)]">Email:</strong> {post.landlord?.email || "Không rõ"}</div>
                      <div><strong className="text-[color:var(--ink)]">Số điện thoại:</strong> {post.landlord?.phone || post.room?.contactPhone || "Chưa cập nhật"}</div>
                      <div><strong className="text-[color:var(--ink)]">Địa chỉ:</strong> {post.room?.address || "Chưa cập nhật"}</div>
                      <div><strong className="text-[color:var(--ink)]">Tiêu đề phòng:</strong> {post.room?.title || "Chưa cập nhật"}</div>
                      <div><strong className="text-[color:var(--ink)]">Loại phòng:</strong> {post.room?.type || "Chưa cập nhật"}</div>
                      <div><strong className="text-[color:var(--ink)]">Giá thuê:</strong> {post.room?.price ? asVnd(post.room.price) : "Chưa cập nhật"}</div>
                      <div><strong className="text-[color:var(--ink)]">Diện tích:</strong> {post.room?.area ? `${post.room.area} m²` : "Chưa cập nhật"}</div>
                      <div className="sm:col-span-2"><strong className="text-[color:var(--ink)]">Tiện ích:</strong> {Array.isArray(post.room?.amenities) && post.room.amenities.length ? post.room.amenities.join(", ") : "Chưa cập nhật"}</div>
                      <div className="sm:col-span-2"><strong className="text-[color:var(--ink)]">Mô tả bài đăng:</strong> {post.description || "Chưa cập nhật"}</div>
                      <div className="sm:col-span-2"><strong className="text-[color:var(--ink)]">Mô tả phòng:</strong> {post.room?.description || "Chưa cập nhật"}</div>
                    </div>
                    {post.room?.images?.length ? (
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-bold text-[color:var(--ink)]">Ảnh đã đăng ký</p>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {post.room.images.map((img) => (
                            <img key={img.id} alt={img.alt || post.room?.title || post.title} className="h-40 w-full rounded-xl object-cover" src={img.url} />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {mode === "admin-verifications" ? (
        <Card title="Xác minh tài khoản chủ trọ">
          <div className="grid gap-4">
            {verifications.map((v) => (
              <div key={v.id} className="rounded-[1.4rem] border border-[color:var(--line)] bg-white p-4 shadow-[0_8px_24px_rgba(22,50,74,0.05)] sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xl font-extrabold text-[color:var(--ink)]">{v.fullName}</p>
                    <div className="mt-2 grid gap-2 text-sm text-[color:var(--muted)] sm:grid-cols-2">
                      <p><strong className="text-[color:var(--ink)]">SĐT:</strong> {v.phone || "Chưa cập nhật"}</p>
                      <p><strong className="text-[color:var(--ink)]">Địa chỉ:</strong> {v.address || "Chưa cập nhật"}</p>
                      <p className="sm:col-span-2"><strong className="text-[color:var(--ink)]">{v.documentType || "Giấy tờ"}:</strong> {v.documentNumber || "Chưa cập nhật"}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                      <span className={`rounded-full px-3 py-1.5 ${v.status === "VERIFIED" ? "bg-emerald-100 text-emerald-700" : v.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>Trạng thái: {statusLabel(v.status)}</span>
                    </div>
                    {v.documentUrl ? <a className="mt-3 inline-block text-sm font-bold text-[color:var(--brand)]" href={v.documentUrl} target="_blank" rel="noreferrer">Xem ảnh giấy tờ</a> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {v.status === "PENDING" ? (
                      <>
                        <button className="button-secondary px-4 py-2.5 text-sm" type="button" onClick={() => approveVerification(v)}>Xác nhận</button>
                        <button className="button-secondary px-4 py-2.5 text-sm" type="button" onClick={() => rejectVerification(v)}>Từ chối</button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {mode === "reports" ? (
        <Card title="Xử lý báo cáo vi phạm">
          <div className="grid gap-4">
            {reports.map((report) => (
              <div key={report.id} className="rounded-[1.4rem] border border-[color:var(--line)] bg-white p-4 shadow-[0_8px_24px_rgba(22,50,74,0.05)] sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xl font-extrabold text-[color:var(--ink)]">{report.reason}</p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">Người báo cáo: {report.reporter?.fullName} · Bài đăng: {report.post?.title}</p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">{report.content}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                      <span className={`rounded-full px-3 py-1.5 ${report.status === "RESOLVED" ? "bg-emerald-100 text-emerald-700" : report.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>Trạng thái: {statusLabel(report.status)}</span>
                    </div>
                    {report.status !== "PENDING" && report.adminNote ? <p className="mt-2 text-sm text-[color:var(--muted)]">Ghi chú: {report.adminNote}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {report.status === "PENDING" ? (
                      <>
                        <button className="button-secondary px-4 py-2.5 text-sm" type="button" onClick={() => resolveReport(report)}>Xử lý và ẩn bài</button>
                        <button className="button-secondary px-4 py-2.5 text-sm" type="button" onClick={() => rejectReport(report)}>Từ chối</button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function parseSupportNotification(rawContent) {
  const raw = String(rawContent || "");
  const marker = "__SUPPORT_META__";
  if (!raw.startsWith(marker)) return { meta: null, message: raw };
  const splitAt = raw.indexOf("\n");
  if (splitAt < 0) return { meta: null, message: raw };
  try {
    const meta = JSON.parse(raw.slice(marker.length, splitAt));
    return { meta, message: raw.slice(splitAt + 1).trim() };
  } catch (_error) {
    return { meta: null, message: raw };
  }
}

function NotificationsSection({ user }) {
  const action = useActionDialog();
  const [notifications, setNotifications] = useState([]);
  const [replyById, setReplyById] = useState({});

  async function loadNotifications() {
    const response = await authRequest("/api/notifications");
    setNotifications(response.notifications || []);
  }

  useEffect(() => { loadNotifications().catch(() => { }); }, []);

  async function sendReply(notificationId) {
    const content = String(replyById[notificationId] || "").trim();
    if (!content) {
      action.warn("Vui lòng nhập nội dung phản hồi.");
      return;
    }
    const ok = await action.run(
      () => authRequest(`/api/notifications/${notificationId}/reply`, { method: "POST", body: JSON.stringify({ content }) }),
      "Đã gửi phản hồi.",
      loadNotifications
    );
    if (ok) {
      setReplyById((current) => ({ ...current, [notificationId]: "" }));
    }
  }

  return (
    <Card title="Thông báo">
      {action.modal}
      <div className="grid gap-3">
        {notifications.length ? notifications.map((notification) => {
          const parsed = parseSupportNotification(notification.content);
          const isSupportNotification = String(notification.type || "").startsWith("SUPPORT_") || String(notification.title || "").includes("[Lien he ho tro]") || String(notification.title || "").includes("[Phan hoi ho tro]");
          const canReply = isSupportNotification && (!parsed.meta?.targetUserId || parsed.meta.targetUserId !== user.id);
          const canReplyLabel = canReply ? "Phản hồi" : "";
          return (
            <div key={notification.id} className="rounded-[1.4rem] border border-[color:var(--line)] bg-white p-4 shadow-[0_8px_24px_rgba(22,50,74,0.05)] sm:p-5">
              <p className="text-lg font-extrabold text-[color:var(--ink)]">{notification.title}</p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">{parsed.message}</p>
              {canReply ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input
                    className="input-shell"
                    placeholder="Nhập phản hồi..."
                    value={replyById[notification.id] || ""}
                    onChange={(event) => setReplyById((current) => ({ ...current, [notification.id]: event.target.value }))}
                  />
                  <button className="button-secondary" type="button" onClick={() => sendReply(notification.id)}>
                    {canReplyLabel}
                  </button>
                </div>
              ) : null}
            </div>
          );
        }) : <p className="text-sm text-[color:var(--muted)]">Chưa có thông báo.</p>}
      </div>
    </Card>
  );
}

function DashboardPage() {
  const { section } = useParams();
  const { isAuthenticated, isLoading, refreshUser, user } = useAuth();

  const stats = useMemo(() => [
    { label: "Vai trò", value: roleLabel(user?.role) },
    { label: "Tài khoản", value: statusLabel(user?.status) },
    { label: "Xác minh", value: statusLabel(user?.verificationStatus) }
  ], [user]);

  if (!isLoading && !isAuthenticated) return <Navigate replace to="/login" />;
  if (isLoading || !user) return <div className="section-space shell">Đang tải tài khoản...</div>;

  const titleBySection = {
    profile: "Thông tin cá nhân",
    notifications: "Thông báo",
    messages: "Tin nhắn",
    reports: user.role === "ADMIN" ? "Xử lý báo cáo vi phạm" : "Báo cáo của tôi",
    verification: "Xác minh chủ trọ",
    rooms: "Quản lý trọ",
    posts: "Quản lý bài đăng",
    "admin-verifications": "Xác minh tài khoản chủ trọ",
    "admin-posts": "Quản lý bài đăng",
    users: "Quản lý tài khoản người dùng"
  };

  function renderOverview() {
    if (user.role === "LANDLORD") {
      return (
        <>
          <ProfileSection user={user} refreshUser={refreshUser} />
          <LandlordSection />
        </>
      );
    }
    if (user.role === "ADMIN") {
      return (
        <>
          <AdminSection />
          <ProfileSection user={user} refreshUser={refreshUser} />
        </>
      );
    }
    return (
      <>
        <ProfileSection user={user} refreshUser={refreshUser} />
        <NotificationsSection user={user} />
        <Card title="Danh mục quản lý sinh viên" description="Các chức năng được tách riêng để dễ theo dõi tin nhắn, báo cáo và thông tin tài khoản.">
          <div className="grid gap-4 md:grid-cols-2">
            <ManagementCard title="Nhắn tin" description="Xem và tiếp tục trao đổi với chủ trọ." to="/dashboard/messages" />
            <ManagementCard title="Báo cáo của tôi" description="Theo dõi tình trạng các báo cáo vi phạm đã gửi." to="/dashboard/reports" />
            <ManagementCard title="Thông tin cá nhân" description="Cập nhật hồ sơ và đổi mật khẩu." to="/dashboard/profile" />
            <ManagementCard title="Thông báo" description="Xem các thông báo mới từ hệ thống." to="/dashboard/notifications" />
          </div>
        </Card>
      </>
    );
  }

  function renderSection() {
    if (!section) return renderOverview();
    if (section === "profile") return <ProfileSection user={user} refreshUser={refreshUser} />;
    if (section === "notifications") return <NotificationsSection user={user} />;
    if (section === "messages") return <MessagesSection />;

    if (user.role === "LANDLORD") {
      if (["verification", "rooms", "posts"].includes(section)) return <LandlordSection mode={section} />;
      return <Navigate replace to="/dashboard" />;
    }

    if (user.role === "ADMIN") {
      if (["admin-verifications", "admin-posts", "users", "reports"].includes(section)) return <AdminSection mode={section} />;
      return <Navigate replace to="/dashboard" />;
    }

    if (user.role === "STUDENT") {
      if (section === "reports") return <StudentSection />;
      return <Navigate replace to="/dashboard" />;
    }

    return <Navigate replace to="/dashboard" />;
  }

  return (
    <>
      <PageIntro
        aside={<div className="text-left"><p className="text-lg font-bold text-[color:var(--ink)]">{roleLabel(user.role)}</p><p className="mt-2">Các chức năng quản lý được tách riêng theo từng danh mục để thao tác dễ hơn.</p></div>}
        description="Khu vực thao tác riêng, chỉ hiển thị đúng chức năng đang chọn để tránh rối giao diện."
        eyebrow="Danh mục quản lý"
        stats={stats}
        title={section ? titleBySection[section] || "Danh mục quản lý" : "Tổng quan"}
      />

      <section className="section-space pt-4">
        <div className="shell space-y-8">
          {renderSection()}
        </div>
      </section>
    </>
  );
}

export default DashboardPage;






