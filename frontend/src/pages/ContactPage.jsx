import FormField from "../components/FormField.jsx";
import { contactCards } from "../data/siteData.js";
import { Icon } from "../components/Icons.jsx";
import PageIntro from "../components/PageIntro.jsx";
import SectionHeader from "../components/SectionHeader.jsx";

function ContactPage() {
  return (
    <>
      <PageIntro
        aside={
          <div className="space-y-3">
            <p className="text-lg font-bold text-[color:var(--ink)]">Khung giờ hỗ trợ</p>
            <p>Thứ 2 đến Thứ 7</p>
            <p>08:00 - 20:00</p>
          </div>
        }
        description="Liên hệ với bộ phận hỗ trợ khi cần tư vấn tìm phòng, đăng tin hoặc xử lý vấn đề tài khoản."
        eyebrow="Liên hệ"
        title="Cần hỗ trợ tìm phòng hoặc đăng tin?"
      />

      <section className="section-space pt-4">
        <div className="shell space-y-8">
          <SectionHeader
            eyebrow="Đầu mối hỗ trợ"
            title="Chọn kênh liên hệ phù hợp với nhu cầu của bạn."
            description="Thông tin hỗ trợ được trình bày ngắn gọn để người dùng dễ liên hệ."
          />

          <div className="grid gap-6 lg:grid-cols-3">
          {contactCards.map((item) => (
            <a
              key={item.title}
              className="panel-soft p-6 transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(23,50,77,0.1)]"
              href={item.href}
              rel="noreferrer"
              target={item.href.startsWith("http") ? "_blank" : undefined}
            >
              <div className="mb-4 inline-flex rounded-2xl bg-[color:var(--accent-soft)] p-3 text-[color:var(--brand)]">
                <Icon className="h-5 w-5" name={item.icon} />
              </div>
              <h2 className="text-xl font-bold text-[color:var(--ink)]">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{item.content}</p>
            </a>
          ))}
          </div>
        </div>
      </section>

      <section className="section-space pt-4">
        <div className="shell grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="panel p-6 sm:p-8">
            <SectionHeader
              eyebrow="Gửi lời nhắn"
              title="Gửi nội dung cần hỗ trợ"
              description="Nhập thông tin liên hệ và nội dung cần được hỗ trợ."
            />
            <form className="mt-8 grid gap-4" onSubmit={(event) => event.preventDefault()}>
              <FormField label="Họ và tên" placeholder="Họ và tên" />
              <FormField label="Email hoặc số điện thoại" placeholder="Email hoặc số điện thoại" />
              <FormField
                label="Nội dung cần hỗ trợ"
                placeholder="Bạn đang cần hỗ trợ về tìm phòng, đăng tin hay kết nối với chủ trọ?"
                textarea
              />
              <button className="button-primary w-full sm:w-fit" type="submit">
                Gửi liên hệ
              </button>
            </form>
          </div>

          <div className="panel-soft p-6 sm:p-8">
            <span className="eyebrow">Câu hỏi thường gặp</span>
            <div className="mt-6 space-y-5">
              <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_10px_30px_rgba(22,50,74,0.06)]">
                <h3 className="text-lg font-bold">Mất bao lâu để đăng tin hoàn chỉnh?</h3>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  Nếu đã có ảnh, địa chỉ và mức giá rõ ràng thì bạn có thể hoàn thành trong vài phút.
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_10px_30px_rgba(22,50,74,0.06)]">
                <h3 className="text-lg font-bold">Sinh viên có thể lọc phòng theo tiện nghi không?</h3>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  Có. Trang danh sách phòng đã được viết lại để lọc theo giá, diện tích và tiện ích.
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_10px_30px_rgba(22,50,74,0.06)]">
                <h3 className="text-lg font-bold">Thông tin phòng có được cập nhật thường xuyên không?</h3>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  Có. Thông tin phòng trọ được cập nhật từ hệ thống quản lý dữ liệu.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default ContactPage;
