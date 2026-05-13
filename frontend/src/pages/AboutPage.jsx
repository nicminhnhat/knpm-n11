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
              Nền tảng giúp sinh viên tìm phòng rõ ràng hơn và giúp chủ trọ tiếp cận đúng người thuê.
            </p>
          </div>
        }
        description="Chúng tôi xây dựng môi trường tìm trọ minh bạch, dễ dùng và đáng tin cậy cho sinh viên tại Huế."
        eyebrow="Về chúng tôi"
        title="Nền tảng hỗ trợ tìm trọ minh bạch cho sinh viên tại Huế."
        stats={siteStats}
      />

      <section className="section-space pt-4">
        <div className="shell space-y-8">
          <SectionHeader
            eyebrow="Giá trị cốt lõi"
            title="Những giá trị chúng tôi cam kết với người dùng."
            description="Thông tin rõ ràng, dễ so sánh và dễ liên hệ để bạn đưa ra quyết định nhanh hơn."
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
                  Chúng tôi ưu tiên thông tin chính xác, hình ảnh rõ ràng và quy trình kiểm duyệt để bạn yên tâm khi tìm hoặc đăng phòng.
                </p>
              </div>
              <div className="grid gap-5">
                <div className="overflow-hidden rounded-[1.75rem] border border-[color:var(--line)]">
                  <img alt="Không gian phòng trọ thực tế" className="h-72 w-full object-cover" src={roomImage} />
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
