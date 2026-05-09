import { Link } from "react-router-dom";
import roomImage from "../assets/anh-tro-2.jpg";
import PageIntro from "../components/PageIntro.jsx";
import { Icon } from "../components/Icons.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { rentBenefits } from "../data/siteData.js";

function RentPage() {
  const { isAuthenticated, user } = useAuth();
  const target = isAuthenticated ? "/dashboard" : "/register";

  return (
    <>
      <PageIntro
        aside={<div className="space-y-3"><p className="text-lg font-bold text-[color:var(--ink)]">Quy trình chủ trọ</p><p>Đăng ký chủ trọ → gửi xác minh → thêm phòng → tạo bài đăng → chờ admin duyệt.</p></div>}
        description="Chủ trọ có thể quản lý phòng, tạo bài đăng và gửi hồ sơ xác minh tại khu vực quản lý."
        eyebrow="Cho thuê phòng"
        title="Đăng tin rõ ràng để sinh viên tìm thấy bạn nhanh hơn."
      />

      <section className="section-space pt-4">
        <div className="shell grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="panel-soft overflow-hidden p-6 sm:p-8">
            <div className="overflow-hidden rounded-[1.5rem] border border-white/70">
              <img alt="Phòng trọ có thể đăng tin nổi bật" className="h-56 w-full object-cover" src={roomImage} />
            </div>
            <div className="mt-6">
              <SectionHeader
                eyebrow="Lợi ích"
                title="Quản lý phòng và bài đăng tập trung trong một màn hình."
                description="Chủ trọ có thể tạo phòng, cập nhật trạng thái còn phòng/hết phòng, tạo bài đăng chờ duyệt và nhắn tin với sinh viên."
              />
            </div>
            <div className="mt-6 grid gap-4">
              {rentBenefits.map((item) => (
                <div key={item} className="flex gap-3 rounded-[1.5rem] bg-white p-4">
                  <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--brand)]">
                    <Icon className="h-4 w-4" name="check" />
                  </span>
                  <p className="text-sm leading-7 text-[color:var(--muted)]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-6 sm:p-8">
            <SectionHeader
              eyebrow="Bắt đầu"
              title={isAuthenticated ? `Xin chào ${user?.fullName}` : "Tạo tài khoản chủ trọ để đăng tin"}
              description={isAuthenticated ? "Bấm nút bên dưới để vào khu vực quản lý phòng trọ và bài đăng." : "Nếu chưa có tài khoản, hãy đăng ký vai trò Chủ trọ. Sau đó gửi hồ sơ xác minh để được phép đăng tin."}
            />
            <div className="mt-8 grid gap-4">
              <Link className="button-primary w-fit" to={target}>{isAuthenticated ? "Vào khu vực quản lý" : "Đăng ký chủ trọ"}</Link>
              {!isAuthenticated ? <Link className="button-secondary w-fit" to="/login">Tôi đã có tài khoản</Link> : null}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default RentPage;
