import roomImage from "../assets/anh-tro-2.jpg";
import PageIntro from "../components/PageIntro.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import { aboutValues, siteStats } from "../data/siteData.js";

function AboutPage() {
  return (
    <>
      <PageIntro
        aside={
          <div className="space-y-3">
            <p className="text-lg font-bold text-[color:var(--ink)]">Thông tin minh bạch</p>
            <p>
              Hệ thống hỗ trợ sinh viên tìm phòng và giúp chủ trọ quản lý tin đăng một cách rõ ràng.
            </p>
          </div>
        }
        description="Hệ thống giúp sinh viên tìm trọ an tâm hơn và giúp chủ trọ đăng tin nhất quán, dễ quản lý hơn."
        eyebrow="Về chúng tôi"
        title="Nền tảng hỗ trợ tìm trọ minh bạch cho sinh viên tại Huế."
        stats={siteStats}
      />

      <section className="section-space pt-4">
        <div className="shell space-y-8">
          <SectionHeader
            eyebrow="Giá trị cốt lõi"
            title="Những giá trị hệ thống hướng đến trong quá trình vận hành."
            description="Thông tin được tổ chức rõ ràng để người dùng dễ tìm kiếm, so sánh và liên hệ."
          />

          <div className="grid gap-6 lg:grid-cols-3">
          {aboutValues.map((item) => (
            <article key={item.title} className="panel-soft p-6 transition duration-200 hover:-translate-y-1">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[color:var(--brand)]">
                Giá trị
              </p>
              <h2 className="mt-4 text-2xl font-bold text-[color:var(--ink)]">{item.title}</h2>
              <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">{item.description}</p>
            </article>
          ))}
          </div>
        </div>
      </section>

      <section className="section-space pt-4">
        <div className="shell">
          <div className="panel overflow-hidden px-6 py-8 sm:px-8 lg:px-10">
            <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-4">
                <span className="eyebrow">Sứ mệnh</span>
                <h2 className="section-heading">Giúp thông tin thuê trọ đủ rõ để người dùng tự tin quyết định.</h2>
                <p className="page-copy">
                  Hệ thống tập trung vào dữ liệu phòng trọ, tài khoản người dùng và quy trình kiểm duyệt để nâng cao độ tin cậy khi tìm kiếm nhà trọ.
                </p>
              </div>
              <div className="grid gap-5">
                <div className="overflow-hidden rounded-[1.75rem] border border-[color:var(--line)]">
                  <img alt="Không gian phòng được trình bày rõ ràng" className="h-72 w-full object-cover" src={roomImage} />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {siteStats.map((item) => (
                    <div key={item.label} className="metric-card">
                      <p className="text-3xl font-extrabold text-[color:var(--brand)]">{item.value}</p>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default AboutPage;
