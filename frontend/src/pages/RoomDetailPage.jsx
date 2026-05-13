import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CustomSelect from "../components/CustomSelect.jsx";
import FeedbackModal from "../components/FeedbackModal.jsx";
import PageIntro from "../components/PageIntro.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest, asVnd, authRequest, normalizeRoom, roomImage, roomTypeLabel, statusLabel } from "../lib/api.js";

function MessageBox({ type = "info", children }) {
  const styles = type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700";
  return <div className={`rounded-2xl border px-4 py-3 text-sm ${styles}`}>{children}</div>;
}

function useFeedback() {
  const [dialog, setDialog] = useState(null);
  function closeDialog() { setDialog(null); }
  function notify(type, title, message) { setDialog({ type, title, message }); }
  function warn(message) { notify("warning", "Cần bổ sung thông tin", message); }
  function confirm(title, message, onConfirm, confirmLabel = "Gửi") { setDialog({ type: "confirm", title, message, confirmLabel, cancelLabel: "Hủy", onConfirm }); }
  async function confirmAction() { const callback = dialog?.onConfirm; closeDialog(); if (callback) await callback(); }
  async function run(callback, successMessage, onSuccess) {
    try {
      await callback();
      notify("success", "Thành công", successMessage);
      await onSuccess?.();
    } catch (error) {
      notify("error", "Không thể thực hiện", error.message || "Thao tác thất bại. Vui lòng thử lại.");
    }
  }
  return { modal: <FeedbackModal dialog={dialog} onClose={closeDialog} onConfirm={confirmAction} />, run, warn, notify, confirm };
}

function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const feedback = useFeedback();
  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: "" });
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const reportReasons = ["Thông tin không chính xác", "Phòng trọ không tồn tại", "Giá thuê sai so với thực tế", "Hình ảnh không đúng thực tế", "Có dấu hiệu lừa đảo", "Nội dung không phù hợp", "Chủ trọ không phản hồi", "Lý do khác"];
  const [reportForm, setReportForm] = useState({ reason: "", content: "" });
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const approvedPost = useMemo(() => room?.posts?.[0], [room]);

  async function loadRoom() {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await apiRequest(`/api/rooms/${id}`);
      setRoom(response.room);
    } catch (error) {
      setErrorMessage(error.message || "Không tải được chi tiết phòng trọ.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadRoom(); }, [id]);

  function requireStudentAction() {
    if (!isAuthenticated) {
      navigate("/login");
      return false;
    }
    if (user?.role !== "STUDENT") {
      feedback.notify("error", "Không thể thực hiện", "Chức năng này dành cho tài khoản sinh viên.");
      return false;
    }
    return true;
  }

  async function openChatWithLandlord() {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }
    if (!requireStudentAction()) return;
    try {
      setIsOpeningChat(true);
      const response = await authRequest("/api/messages/threads", {
        method: "POST",
        body: JSON.stringify({
          landlordId: normalizeRoom(room)?.landlordId,
          roomId: normalizeRoom(room)?.id,
          postId: approvedPost?.id,
          content: "Xin chào, em muốn hỏi thêm thông tin về phòng trọ này."
        })
      });
      navigate(`/dashboard/messages?thread=${response.thread?.id || ""}`);
    } catch (error) {
      feedback.notify("error", "Không thể mở cuộc trò chuyện", error.message || "Vui lòng thử lại sau.");
    } finally {
      setIsOpeningChat(false);
    }
  }

  const item = normalizeRoom(room);
  const imageList = item?.images?.length ? item.images : item ? [{ url: roomImage(item), alt: item.title }] : [];
  const activeImage = imageList[activeImageIndex] || imageList[0];

  useEffect(() => {
    setActiveImageIndex(0);
  }, [id, imageList.length]);

  const mapQuery = item ? `${item.address || ""} ${item.district || ""} Huế`.trim() : "Huế";
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;

  return (
    <>
      {showAuthPrompt ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.25)]">
            <button
              aria-label="Đóng"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-base font-semibold text-[color:var(--muted)] transition hover:bg-slate-100"
              type="button"
              onClick={() => setShowAuthPrompt(false)}
            >
              X
            </button>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-xl font-extrabold text-amber-700">
                !
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-extrabold text-[color:var(--ink)]">Bạn cần đăng nhập trước</h3>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  Vui lòng đăng nhập hoặc đăng ký tài khoản để nhắn tin liên hệ chủ trọ.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="button-secondary"
                type="button"
                onClick={() => {
                  setShowAuthPrompt(false);
                  navigate("/register");
                }}
              >
                Đăng ký
              </button>
              <button
                className="button-primary"
                type="button"
                onClick={() => {
                  setShowAuthPrompt(false);
                  navigate("/login");
                }}
              >
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {feedback.modal}
      <PageIntro
        aside={<div className="text-left"><p className="text-lg font-bold text-[color:var(--ink)]">Thông tin phòng trọ</p><p className="mt-2">Xem nhanh giá thuê, tiện ích và liên hệ chủ trọ khi phòng phù hợp.</p></div>}
        description="Xem hình ảnh thực tế, giá thuê, diện tích, địa chỉ, tiện ích và thông tin liên hệ trước khi quyết định."
        eyebrow="Chi tiết phòng trọ"
        title={isLoading ? "Đang tải thông tin phòng..." : item?.title || "Không tìm thấy phòng"}
      />

      <section className="section-space pt-4">
        <div className="shell space-y-8">
          {errorMessage ? <MessageBox type="error">{errorMessage}</MessageBox> : null}

          {item ? (
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <div className="panel overflow-hidden">
                  <div className="relative">
                    <img alt={activeImage?.alt || item.title} className="h-[420px] w-full object-cover" src={activeImage?.url || roomImage(item)} />
                    {imageList.length > 1 ? (
                      <>
                        <button
                          aria-label="Ảnh trước"
                          className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold text-[color:var(--ink)] shadow-[0_14px_35px_rgba(22,50,74,0.18)] transition hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--brand)]"
                          type="button"
                          onClick={() => setActiveImageIndex((current) => (current - 1 + imageList.length) % imageList.length)}
                        >
                          ‹
                        </button>
                        <button
                          aria-label="Ảnh tiếp theo"
                          className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold text-[color:var(--ink)] shadow-[0_14px_35px_rgba(22,50,74,0.18)] transition hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--brand)]"
                          type="button"
                          onClick={() => setActiveImageIndex((current) => (current + 1) % imageList.length)}
                        >
                          ›
                        </button>
                        <div className="absolute bottom-4 left-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold text-[color:var(--ink)] shadow-[0_10px_25px_rgba(22,50,74,0.16)]">
                          {activeImageIndex + 1}/{imageList.length}
                        </div>
                      </>
                    ) : null}
                  </div>
                  {imageList.length > 1 ? (
                    <div className="flex gap-3 overflow-x-auto p-4">
                      {imageList.map((image, index) => (
                        <button
                          className={`h-24 w-32 shrink-0 overflow-hidden rounded-2xl border-2 transition ${activeImageIndex === index ? "border-[color:var(--brand)] shadow-[0_10px_25px_rgba(213,91,54,0.2)]" : "border-transparent opacity-75 hover:opacity-100"}`}
                          key={`${image.url}-${index}`}
                          type="button"
                          onClick={() => setActiveImageIndex(index)}
                        >
                          <img alt={image.alt || item.title} className="h-full w-full object-cover" src={image.url} />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="panel p-6 sm:p-8">
                  <div className="flex flex-wrap gap-3">
                    {[roomTypeLabel(item.type), statusLabel(item.status), item.district || item.city].filter(Boolean).map((tag) => (
                      <span key={tag} className="pill-tag bg-[color:var(--accent-soft)] text-[color:var(--brand)]">{tag}</span>
                    ))}
                  </div>
                  <h2 className="mt-5 font-display text-3xl text-[color:var(--ink)]">{item.title}</h2>
                  <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">{item.description}</p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="metric-card"><p className="text-xl font-extrabold text-[color:var(--brand)]">{asVnd(item.price)}</p><p className="mt-1 text-sm text-[color:var(--muted)]">Giá thuê</p></div>
                    <div className="metric-card"><p className="text-xl font-extrabold text-[color:var(--brand)]">{item.area} m²</p><p className="mt-1 text-sm text-[color:var(--muted)]">Diện tích</p></div>
                    <div className="metric-card"><p className="text-xl font-extrabold text-[color:var(--brand)]">{item.deposit ? asVnd(item.deposit) : "Chưa cập nhật"}</p><p className="mt-1 text-sm text-[color:var(--muted)]">Tiền cọc</p></div>
                  </div>
                </div>

                <div className="panel p-6 sm:p-8">
                  <h3 className="text-xl font-bold text-[color:var(--ink)]">Tiện ích và chi phí</h3>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {(item.amenities?.length ? item.amenities : ["Chưa cập nhật tiện ích"]).map((amenity) => <span key={amenity} className="pill-tag bg-white text-[color:var(--ink)]">{amenity}</span>)}
                  </div>
                  <div className="mt-6 grid gap-3 text-sm text-[color:var(--muted)] sm:grid-cols-3">
                    <p>Điện: {item.electricityPrice ? asVnd(item.electricityPrice) : "Theo giá thực tế"}</p>
                    <p>Nước: {item.waterPrice ? asVnd(item.waterPrice) : "Theo giá thực tế"}</p>
                    <p>Internet: {item.internetPrice ? asVnd(item.internetPrice) : "Theo gói phòng"}</p>
                  </div>
                </div>

                <div className="panel overflow-hidden p-6 sm:p-8">
                  <h3 className="text-xl font-bold text-[color:var(--ink)]">Vị trí phòng trọ trên bản đồ</h3>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">{item.address}</p>
                  <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-[color:var(--line)]">
                    <iframe
                      className="h-80 w-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={mapSrc}
                      title={`Bản đồ ${item.title}`}
                    />
                  </div>
                </div>

                <div className="panel p-6 sm:p-8">
                  <h3 className="text-xl font-bold text-[color:var(--ink)]">Đánh giá phòng trọ</h3>
                  <div className="mt-5 space-y-4">
                    {item.reviews?.length ? item.reviews.map((review) => (
                      <div key={review.id} className="panel-soft p-4">
                        <div className="flex items-center justify-between gap-3">
                          <strong>{review.student?.fullName || "Sinh viên"}</strong>
                          <span className="text-sm font-bold text-[color:var(--brand)]">{review.rating}/5 sao</span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{review.content || "Không có nội dung."}</p>
                      </div>
                    )) : <p className="text-sm text-[color:var(--muted)]">Chưa có đánh giá nào.</p>}
                  </div>

                  <form className="mt-6 grid gap-4" onSubmit={(event) => {
                    event.preventDefault();
                    if (!requireStudentAction()) return;
                    if (!String(reviewForm.content || "").trim()) {
                      feedback.warn("Vui lòng nhập nội dung đánh giá.");
                      return;
                    }
                    feedback.run(
                      () => authRequest(`/api/rooms/${item.id}/reviews`, { method: "POST", body: JSON.stringify(reviewForm) }),
                      "Đánh giá phòng trọ đã được gửi.",
                      loadRoom
                    );
                  }}>
                    <CustomSelect value={String(reviewForm.rating)} onChange={(e) => setReviewForm((v) => ({ ...v, rating: Number(e.target.value) }))}>
                      {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={String(rating)}>{rating} sao</option>)}
                    </CustomSelect>
                    <textarea className="input-shell min-h-28" placeholder="Viết đánh giá của bạn" value={reviewForm.content} onChange={(e) => setReviewForm((v) => ({ ...v, content: e.target.value }))} />
                    <button className="button-primary w-fit" type="submit">Gửi đánh giá</button>
                  </form>
                </div>
              </div>

              <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
                <div className="panel p-6">
                  <h3 className="text-xl font-bold text-[color:var(--ink)]">Thông tin liên hệ</h3>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-[color:var(--muted)]">
                    <p><strong className="text-[color:var(--ink)]">Địa chỉ:</strong> {item.address}</p>
                    <p><strong className="text-[color:var(--ink)]">Chủ trọ:</strong> {item.ownerName}</p>
                    <p><strong className="text-[color:var(--ink)]">Số điện thoại:</strong> {item.contactPhone || item.landlord?.phone || "Chưa cập nhật"}</p>
                  </div>
                  <div className="mt-6 grid gap-3">
                    <button className="button-primary justify-center" disabled={isOpeningChat} type="button" onClick={openChatWithLandlord}>
                      {isOpeningChat ? "Đang mở cuộc trò chuyện..." : "Nhắn tin liên hệ"}
                    </button>
                  </div>
                </div>

                <div className="panel p-6">
                  <h3 className="text-xl font-bold text-[color:var(--ink)]">Báo cáo vi phạm</h3>
                  <form className="mt-4 grid gap-4" onSubmit={(event) => {
                    event.preventDefault();
                    if (!requireStudentAction()) return;
                    if (!approvedPost?.id) {
                      feedback.notify("error", "Không thể thực hiện", "Không tìm thấy bài đăng công khai để báo cáo.");
                      return;
                    }
                    if (!String(reportForm.reason || "").trim()) {
                      feedback.warn("Vui lòng chọn lý do báo cáo.");
                      return;
                    }
                    feedback.confirm(
                      "Xác nhận gửi báo cáo",
                      "Bạn có chắc chắn muốn gửi báo cáo này không?",
                      () => feedback.run(
                        () => authRequest("/api/reports", { method: "POST", body: JSON.stringify({ postId: approvedPost.id, ...reportForm }) }),
                        "Báo cáo đã được gửi đến quản trị viên.",
                        loadRoom
                      ),
                      "Gửi"
                    );
                  }}>
                    <CustomSelect
                      options={reportReasons.map((reason) => ({ label: reason, value: reason }))}
                      placeholder="Chọn lý do báo cáo"
                      value={reportForm.reason}
                      onChange={(e) => setReportForm((v) => ({ ...v, reason: e.target.value }))}
                    />
                    <textarea className="input-shell min-h-32 resize-y leading-7" placeholder="Mô tả chi tiết vi phạm" value={reportForm.content} onChange={(e) => setReportForm((v) => ({ ...v, content: e.target.value }))} />
                    <button className="button-secondary justify-center" type="submit">Gửi báo cáo</button>
                  </form>
                </div>
              </aside>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}

export default RoomDetailPage;
