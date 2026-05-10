import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
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

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[color:var(--ink)]">
      <span>{label}</span>
      {children}
    </label>
  );
}

function TextInput(props) {
  return <input {...props} className={`input-shell ${props.className || ""}`} />;
}

function TextArea(props) {
  return <textarea {...props} className={`input-shell min-h-24 ${props.className || ""}`} />;
}

function Select(props) {
  return <select {...props} className={`input-shell ${props.className || ""}`} />;
}

function ImageUploadField({ label, value, onChange, action, previewAlt = "Hình ảnh" }) {
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
    }
  }

  return (
    <Field label={label}>
      <div className="grid gap-3">
        <input accept="image/*" className="input-shell" type="file" onChange={handleFile} />
        {isUploading ? <p className="text-xs font-semibold text-[color:var(--brand)]">Đang tải hình ảnh...</p> : null}
        <TextInput placeholder="Hoặc nhập liên kết hình ảnh" value={value || ""} onChange={(e) => onChange(e.target.value)} />
        {value ? <img alt={previewAlt} className="h-32 w-full rounded-2xl object-cover" src={value} /> : null}
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
  return { confirm, modal, requestText, run, warn };
}

function isBlank(value) {
  return !String(value || "").trim();
}

function validateRoomForm(form) {
  if (isBlank(form.title)) return "Vui lòng nhập tiêu đề phòng trọ.";
  if (isBlank(form.address)) return "Vui lòng nhập địa chỉ phòng trọ.";
  if (isBlank(form.price) || Number(form.price) <= 0) return "Vui lòng nhập giá phòng hợp lệ.";
  if (isBlank(form.area) || Number(form.area) <= 0) return "Vui lòng nhập diện tích phòng hợp lệ.";
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
  const action = useActionDialog();
  const [favorites, setFavorites] = useState([]);
  const [reports, setReports] = useState([]);

  async function load() {
    const [fav, rep] = await Promise.all([authRequest("/api/favorites"), authRequest("/api/my/reports")]);
    setFavorites(fav.favorites || []);
    setReports(rep.reports || []);
  }

  useEffect(() => { load().catch(() => { }); }, []);

  return (
    <Card title="Khu vực sinh viên">
      {action.modal}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="font-bold text-[color:var(--ink)]">Phòng yêu thích</h3>
          {favorites.length ? favorites.map((favorite) => (
            <div key={favorite.id} className="panel-soft p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold">{favorite.room?.title}</p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">{favorite.room?.address}</p>
                  <p className="mt-1 text-sm font-bold text-[color:var(--brand)]">{asVnd(favorite.room?.price)}</p>
                </div>
                <button className="button-secondary px-3 py-2 text-xs" type="button" onClick={() => action.confirm(
                  "Bỏ lưu phòng trọ",
                  "Bạn có chắc chắn muốn bỏ phòng này khỏi danh sách yêu thích?",
                  () => action.run(
                    () => authRequest(`/api/favorites/${favorite.roomId}`, { method: "DELETE" }),
                    "Đã bỏ phòng khỏi danh sách yêu thích.",
                    load
                  ),
                  "Bỏ lưu"
                )}>Bỏ lưu</button>
              </div>
            </div>
          )) : <p className="text-sm text-[color:var(--muted)]">Chưa lưu phòng nào.</p>}
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-[color:var(--ink)]">Báo cáo của tôi</h3>
          {reports.length ? reports.map((report) => (
            <div key={report.id} className="panel-soft p-4">
              <div className="flex items-center justify-between gap-3"><p className="font-bold">{report.reason}</p><Badge>{statusLabel(report.status)}</Badge></div>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{report.post?.title}</p>
              {report.adminNote ? <p className="mt-2 text-sm text-[color:var(--muted)]">Phản hồi: {report.adminNote}</p> : null}
            </div>
          )) : <p className="text-sm text-[color:var(--muted)]">Chưa gửi báo cáo.</p>}
        </div>
      </div>
    </Card>
  );
}

function LandlordSection() {
  const action = useActionDialog();
  const emptyRoomForm = { title: "", description: "", address: "", district: "TP Huế", price: "", area: "", type: "SINGLE", amenities: "Wifi, chỗ để xe", contactPhone: "", imageUrl: "" };
  const emptyPostForm = { roomId: "", title: "", description: "", imageUrl: "" };
  const [verification, setVerification] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [posts, setPosts] = useState([]);
  const [roomForm, setRoomForm] = useState(emptyRoomForm);
  const [postForm, setPostForm] = useState(emptyPostForm);
  const [verifyForm, setVerifyForm] = useState({ fullName: "", phone: "", address: "", documentType: "CCCD", documentNumber: "", documentUrl: "", note: "" });

  async function load() {
    const [r, p] = await Promise.all([authRequest("/api/landlord/rooms"), authRequest("/api/landlord/posts")]);
    const roomList = r.rooms || [];
    console.log(roomList);
    setRooms(roomList);
    setPosts(p.posts || []);
    setPostForm((cur) => ({ ...cur, roomId: cur.roomId || roomList[0]?.id || "" }));
  }

  useEffect(() => { load().catch(() => { }); }, []);

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
      amenities: roomForm.amenities.split(",").map((x) => x.trim()).filter(Boolean),
      images: [{ url: roomForm.imageUrl, alt: roomForm.title }]
    };
    const ok = await action.run(
      () => authRequest("/api/landlord/rooms", { method: "POST", body: JSON.stringify(payload) }),
      "Phòng trọ đã được thêm vào hệ thống.",
      load
    );
    if (ok) setRoomForm(emptyRoomForm);
  }

  function submitPost(event) {
    event.preventDefault();
    const error = validatePostForm(postForm);
    if (error) {
      action.warn(error);
      return;
    }
    action.confirm(
      "Xác nhận đăng bài",
      "Bài đăng sẽ được gửi đến quản trị viên để kiểm duyệt trước khi hiển thị công khai.",
      async () => {
        const ok = await action.run(
          () => authRequest("/api/landlord/posts", { method: "POST", body: JSON.stringify(postForm) }),
          "Bài đăng đã được tạo và đang chờ kiểm duyệt.",
          load
        );
        if (ok) setPostForm({ ...emptyPostForm, roomId: rooms[0]?.id || "" });
      },
      "Đăng bài"
    );
  }

  return (
    <div className="space-y-8">
      {action.modal}
      <Card title="Xác minh chủ trọ">
        {verification ? <div className="mb-5 panel-soft p-4"><div className="flex items-center justify-between"><strong>Hồ sơ gần nhất</strong><Badge>{statusLabel(verification.status)}</Badge></div>{verification.rejectionReason ? <p className="mt-2 text-sm text-red-700">Lý do từ chối: {verification.rejectionReason}</p> : null}</div> : null}
        <form className="grid gap-4 lg:grid-cols-2" onSubmit={async (event) => {
          event.preventDefault();
          if (isBlank(verifyForm.fullName) || isBlank(verifyForm.phone) || isBlank(verifyForm.documentNumber)) {
            action.warn("Vui lòng nhập đầy đủ họ tên, số điện thoại và số giấy tờ.");
            return;
          }
          await action.run(
            () => authRequest("/api/verification/requests", { method: "POST", body: JSON.stringify(verifyForm) }),
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

      <Card title="Quản lý phòng trọ">
        <form className="grid gap-4 lg:grid-cols-3" onSubmit={submitRoom}>
          <Field label="Tiêu đề phòng"><TextInput value={roomForm.title} onChange={(e) => setRoomForm((v) => ({ ...v, title: e.target.value }))} /></Field>
          <Field label="Giá thuê"><TextInput type="number" value={roomForm.price} onChange={(e) => setRoomForm((v) => ({ ...v, price: e.target.value }))} /></Field>
          <Field label="Diện tích"><TextInput type="number" value={roomForm.area} onChange={(e) => setRoomForm((v) => ({ ...v, area: e.target.value }))} /></Field>
          <Field label="Địa chỉ"><TextInput value={roomForm.address} onChange={(e) => setRoomForm((v) => ({ ...v, address: e.target.value }))} /></Field>
          <Field label="Khu vực"><TextInput value={roomForm.district} onChange={(e) => setRoomForm((v) => ({ ...v, district: e.target.value }))} /></Field>
          <Field label="Loại phòng"><Select value={roomForm.type} onChange={(e) => setRoomForm((v) => ({ ...v, type: e.target.value }))}><option value="SINGLE">Phòng đơn</option><option value="SHARED">Ở ghép</option><option value="APARTMENT">Căn hộ</option><option value="OTHER">Khác</option></Select></Field>
          <Field label="Tiện ích"><TextInput value={roomForm.amenities} onChange={(e) => setRoomForm((v) => ({ ...v, amenities: e.target.value }))} /></Field>
          <Field label="Số điện thoại liên hệ"><TextInput value={roomForm.contactPhone} onChange={(e) => setRoomForm((v) => ({ ...v, contactPhone: e.target.value }))} /></Field>
          <ImageUploadField label="Hình ảnh phòng trọ" value={roomForm.imageUrl} onChange={(url) => setRoomForm((v) => ({ ...v, imageUrl: url }))} action={action} previewAlt={roomForm.title || "Hình ảnh phòng trọ"} />
          <Field label="Mô tả phòng"><TextArea value={roomForm.description} onChange={(e) => setRoomForm((v) => ({ ...v, description: e.target.value }))} className="lg:col-span-3" /></Field>
          <button className="button-primary w-fit lg:col-span-3" type="submit">Thêm phòng</button>
        </form>
        <div className="mt-6 grid gap-4">
          {rooms.map((room) => (
            <div key={room.id} className="panel-soft p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <img alt={room.title} className="h-20 w-28 rounded-2xl object-cover" src={roomImage(room)} />
                  <div>
                    <p className="font-bold">{room.title}</p>
                    <p className="text-sm text-[color:var(--muted)]">{room.address} · {asVnd(room.price)} · {statusLabel(room.status)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="button-secondary px-3 py-2 text-xs" type="button" onClick={() => action.run(
                    () => authRequest(`/api/landlord/rooms/${room.id}/status`, { method: "PATCH", body: JSON.stringify({ status: room.status === "AVAILABLE" ? "RENTED" : "AVAILABLE" }) }),
                    "Trạng thái phòng đã được cập nhật.",
                    load
                  )}>Đổi trạng thái</button>
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
          ))}
        </div>
      </Card>

      <Card title="Quản lý bài đăng">
        <form className="grid gap-4 lg:grid-cols-2" onSubmit={submitPost}>
          <Field label="Chọn phòng trọ"><Select value={postForm.roomId} onChange={(e) => setPostForm((v) => ({ ...v, roomId: e.target.value }))}>{rooms.map((room) => <option key={room.id} value={room.id}>{room.title}</option>)}</Select></Field>
          <Field label="Tiêu đề bài đăng"><TextInput value={postForm.title} onChange={(e) => setPostForm((v) => ({ ...v, title: e.target.value }))} /></Field>
          <ImageUploadField label="Hình ảnh bài đăng" value={postForm.imageUrl} onChange={(url) => setPostForm((v) => ({ ...v, imageUrl: url }))} action={action} previewAlt={postForm.title || "Hình ảnh bài đăng"} />
          <Field label="Mô tả bài đăng"><TextArea value={postForm.description} onChange={(e) => setPostForm((v) => ({ ...v, description: e.target.value }))} className="lg:col-span-2" /></Field>
          <button className="button-primary w-fit lg:col-span-2" type="submit">Tạo bài đăng</button>
        </form>
        <div className="mt-6 grid gap-4">
          {posts.map((post) => (
            <div key={post.id} className="panel-soft p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  {post.room ? <img alt={post.title} className="h-20 w-28 rounded-2xl object-cover" src={roomImage(post.room)} /> : null}
                  <div>
                    <div className="flex items-center gap-3"><p className="font-bold">{post.title}</p><Badge>{statusLabel(post.status)}</Badge></div>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">{post.rejectReason || post.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.status === "HIDDEN" ? (
                    <button className="button-secondary px-3 py-2 text-xs" type="button" onClick={() => action.run(
                      () => authRequest(`/api/landlord/posts/${post.id}/unhide`, { method: "PATCH" }),
                      "Bài đăng đã được hiển thị lại.",
                      load
                    )}>Hiện lại</button>
                  ) : (
                    <button className="button-secondary px-3 py-2 text-xs" type="button" onClick={() => action.run(
                      () => authRequest(`/api/landlord/posts/${post.id}/hide`, { method: "PATCH" }),
                      "Bài đăng đã được ẩn.",
                      load
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
          ))}
        </div>
      </Card>
    </div>
  );
}

function MessagesSection() {
  const action = useActionDialog();
  const [threads, setThreads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");

  async function loadThreads() {
    const response = await authRequest("/api/messages/threads");
    setThreads(response.threads || []);
  }

  async function loadMessages(threadId) {
    const response = await authRequest(`/api/messages/threads/${threadId}/messages`);
    setMessages(response.messages || []);
  }

  useEffect(() => { loadThreads().catch(() => { }); }, []);

  return (
    <Card title="Tin nhắn">
      {action.modal}
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-3">
          {threads.map((thread) => <button key={thread.id} className={`w-full rounded-2xl border p-4 text-left text-sm ${selected?.id === thread.id ? "border-[color:var(--brand)] bg-orange-50" : "border-[color:var(--line)] bg-white"}`} onClick={() => { setSelected(thread); loadMessages(thread.id); }}><strong>{thread.room?.title || thread.post?.title || "Cuộc trò chuyện"}</strong><p className="mt-1 text-[color:var(--muted)]">Sinh viên: {thread.student?.fullName} · Chủ trọ: {thread.landlord?.fullName}</p></button>)}
          {!threads.length ? <p className="text-sm text-[color:var(--muted)]">Chưa có cuộc trò chuyện.</p> : null}
        </div>
        <div className="panel-soft p-4">
          {selected ? (
            <>
              <div className="max-h-80 space-y-3 overflow-y-auto pr-2">
                {messages.map((msg) => <div key={msg.id} className="rounded-2xl bg-white p-3 text-sm"><strong>{msg.sender?.fullName || "Người gửi"}</strong><p className="mt-1 text-[color:var(--muted)]">{msg.content}</p></div>)}
              </div>
              <form className="mt-4 flex gap-3" onSubmit={async (event) => {
                event.preventDefault();
                if (isBlank(content)) {
                  action.warn("Vui lòng nhập nội dung tin nhắn.");
                  return;
                }
                const ok = await action.run(
                  () => authRequest(`/api/messages/threads/${selected.id}/messages`, { method: "POST", body: JSON.stringify({ content }) }),
                  "Tin nhắn đã được gửi.",
                  () => { loadMessages(selected.id); loadThreads(); }
                );
                if (ok) setContent("");
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

function AdminSection() {
  const action = useActionDialog();
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
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
        load
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
        load
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
        load
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
      <Card title="Bảng điều khiển quản trị">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(dashboard || {}).filter(([, v]) => typeof v !== "object").map(([k, v]) => (
            <div key={k} className="metric-card">
              <p className="text-2xl font-extrabold text-[color:var(--brand)]">{String(v)}</p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">{statLabel(k)}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Quản lý tài khoản người dùng">
        <div className="grid gap-4">
          {users.map((u) => (
            <div key={u.id} className="panel-soft p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-bold">{u.fullName}</p>
                  <p className="text-sm text-[color:var(--muted)]">{u.email} · {roleLabel(u.role)} · {statusLabel(u.status)} · Xác minh: {statusLabel(u.verificationStatus)}</p>
                </div>
                <div className="flex gap-2">
                  <button className="button-secondary px-3 py-2 text-xs" type="button" onClick={() => lockUser(u)}>Khóa</button>
                  <button className="button-secondary px-3 py-2 text-xs" type="button" onClick={() => unlockUser(u)}>Mở khóa</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Kiểm duyệt bài đăng">
        <div className="grid gap-4">
          {posts.map((post) => (
            <div key={post.id} className="panel-soft p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold">{post.title}</p>
                <Badge>{statusLabel(post.status)}</Badge>
              </div>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{post.landlord?.fullName} · {post.room?.address}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="button-secondary px-3 py-2 text-xs" type="button" onClick={() => approvePost(post)}>Duyệt</button>
                <button className="button-secondary px-3 py-2 text-xs" type="button" onClick={() => rejectPost(post)}>Từ chối</button>
                <button className="button-secondary px-3 py-2 text-xs" type="button" onClick={() => hidePost(post)}>Ẩn</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Xác minh tài khoản chủ trọ">
        <div className="grid gap-4">
          {verifications.map((v) => (
            <div key={v.id} className="panel-soft p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold">{v.fullName}</p>
                <Badge>{statusLabel(v.status)}</Badge>
              </div>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{v.phone} · {v.address} · {v.documentType}: {v.documentNumber}</p>
              {v.documentUrl ? <a className="mt-2 inline-block text-sm font-bold text-[color:var(--brand)]" href={v.documentUrl} target="_blank" rel="noreferrer">Xem ảnh giấy tờ</a> : null}
              {v.status === "PENDING" ? (
                <div className="mt-3 flex gap-2">
                  <button className="button-secondary px-3 py-2 text-xs" type="button" onClick={() => approveVerification(v)}>Xác nhận</button>
                  <button className="button-secondary px-3 py-2 text-xs" type="button" onClick={() => rejectVerification(v)}>Từ chối</button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      <Card title="Xử lý báo cáo vi phạm">
        <div className="grid gap-4">
          {reports.map((report) => (
            <div key={report.id} className="panel-soft p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold">{report.reason}</p>
                <Badge>{statusLabel(report.status)}</Badge>
              </div>
              <p className="mt-2 text-sm text-[color:var(--muted)]">Người báo cáo: {report.reporter?.fullName} · Bài đăng: {report.post?.title}</p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">{report.content}</p>
              {report.status === "PENDING" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="button-secondary px-3 py-2 text-xs" type="button" onClick={() => resolveReport(report)}>Xử lý và ẩn bài</button>
                  <button className="button-secondary px-3 py-2 text-xs" type="button" onClick={() => rejectReport(report)}>Từ chối</button>
                </div>
              ) : report.adminNote ? <p className="mt-3 text-sm text-[color:var(--muted)]">Ghi chú: {report.adminNote}</p> : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function NotificationsSection() {
  const [notifications, setNotifications] = useState([]);
  useEffect(() => { authRequest("/api/notifications").then((r) => setNotifications(r.notifications || [])).catch(() => { }); }, []);
  return <Card title="Thông báo"><div className="grid gap-3">{notifications.length ? notifications.map((n) => <div key={n.id} className="panel-soft p-4"><p className="font-bold">{n.title}</p><p className="mt-1 text-sm text-[color:var(--muted)]">{n.content}</p></div>) : <p className="text-sm text-[color:var(--muted)]">Chưa có thông báo.</p>}</div></Card>;
}

function DashboardPage() {
  const { isAuthenticated, isLoading, refreshUser, user } = useAuth();

  const stats = useMemo(() => [
    { label: "Vai trò", value: roleLabel(user?.role) },
    { label: "Tài khoản", value: statusLabel(user?.status) },
    { label: "Xác minh", value: statusLabel(user?.verificationStatus) }
  ], [user]);

  if (!isLoading && !isAuthenticated) return <Navigate replace to="/login" />;
  if (isLoading || !user) return <div className="section-space shell">Đang tải tài khoản...</div>;

  return (
    <>
      <PageIntro
        aside={<div className="text-left"><p className="text-lg font-bold text-[color:var(--ink)]">{roleLabel(user.role)}</p><p className="mt-2">Quản lý thông tin và thao tác nghiệp vụ theo quyền tài khoản.</p></div>}
        description="Khu vực quản lý thông tin cá nhân, phòng trọ, bài đăng, tin nhắn, xác minh, báo cáo và tài khoản người dùng."
        eyebrow="Bảng điều khiển"
        stats={stats}
        title={`Xin chào, ${user.fullName}`}
      />

      <section className="section-space pt-4">
        <div className="shell space-y-8">
          <ProfileSection user={user} refreshUser={refreshUser} />
          <NotificationsSection />
          {user.role === "STUDENT" ? <><StudentSection /><MessagesSection /></> : null}
          {user.role === "LANDLORD" ? <><LandlordSection /><MessagesSection /></> : null}
          {user.role === "ADMIN" ? <AdminSection /> : null}
        </div>
      </section>
    </>
  );
}

export default DashboardPage;
