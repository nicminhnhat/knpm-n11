import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <section className="section-space">
      <div className="shell">
        <div className="panel mx-auto max-w-3xl px-6 py-14 text-center sm:px-8">
          <span className="eyebrow">404</span>
          <h1 className="page-title mt-6">Trang bạn tìm không tồn tại.</h1>
          <p className="page-copy mx-auto mt-4 max-w-xl">
            Đường dẫn bạn truy cập không hợp lệ hoặc nội dung đã được di chuyển.
          </p>
          <div className="mt-8">
            <Link className="button-primary" to="/">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default NotFoundPage;
