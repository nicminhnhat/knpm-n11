import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  async function run(callback, successMessage, onSuccess) {
    try {
      await callback();
      notify("success", "Thành công", successMessage);
      await onSuccess?.();
    } catch (error) {
      notify("error", "Không thể thực hiện", error.message || "Thao tác thất bại. Vui lòng thử lại.");
    }
  }
  return { modal: <FeedbackModal dialog={dialog} onClose={closeDialog} />, run, warn, notify };
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
          landlordId: item.landlordId,
          roomId: item.id,
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
        aside={<div className="text-left"><p className="text-lg font-bold text-[color:var(--ink)]">Thông tin phòng trọ</p><p className="mt-2">Theo dõi giá thuê, tiện ích, đánh giá và liên hệ chủ trọ.</p></div>}
        description="Xem hình ảnh, giá thuê, diện tích, tiện ích, thông tin chủ trọ, đánh giá và báo cáo vi phạm."
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
                  <img alt={imageList[0]?.alt || item.title} className="h-[420px] w-full object-cover" src={imageList[0]?.url || roomImage(item)} />
                  {imageList.length > 1 ? (
                    <div className="grid gap-3 p-4 sm:grid-cols-3">
                      {imageList.slice(1, 4).map((image, index) => (
                        <img key={`${image.url}-${index}`} alt={image.alt || item.title} className="h-28 w-full rounded-2xl object-cover" src={image.url} />
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
                    <select className="input-shell" value={reviewForm.rating} onChange={(e) => setReviewForm((v) => ({ ...v, rating: Number(e.target.value) }))}>
                      {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} sao</option>)}
                    </select>
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
                    feedback.run(
                      () => authRequest("/api/reports", { method: "POST", body: JSON.stringify({ postId: approvedPost.id, ...reportForm }) }),
                      "Báo cáo đã được gửi đến quản trị viên.",
                      loadRoom
                    );
                  }}>
                    <select className="input-shell" value={reportForm.reason} onChange={(e) => setReportForm((v) => ({ ...v, reason: e.target.value }))}>
                      <option value="">Chọn lý do báo cáo</option>
                      {reportReasons.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
                    </select>
                    <textarea className="input-shell min-h-32" placeholder="Mô tả chi tiết vi phạm" value={reportForm.content} onChange={(e) => setReportForm((v) => ({ ...v, content: e.target.value }))} />
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
