import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import cozyRoomImage from "../assets/anh-tro-1.jpg";
import loftRoomImage from "../assets/anh-tro-2.jpg";
import simpleRoomImage from "../assets/anh-tro-3.jpg";
import { Icon } from "../components/Icons.jsx";
import RoomCard from "../components/RoomCard.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import { homeFeatures, rooms as sampleRooms, siteStats } from "../data/siteData.js";
import { apiRequest } from "../lib/api.js";

function HomePage() {
  const [featuredRooms, setFeaturedRooms] = useState(sampleRooms.slice(0, 3));

  useEffect(() => {
    apiRequest("/api/rooms?limit=3")
      .then((response) => {
        if (response.rooms?.length) setFeaturedRooms(response.rooms);
      })
      .catch(() => {
        setFeaturedRooms(sampleRooms.slice(0, 3));
      });
  }, []);

  return (
    <>
      <section className="section-space pb-10">
        <div className="shell">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-8">
              <span className="eyebrow">Nền tảng tìm trọ cho sinh viên Huế</span>
              <div className="space-y-5">
                <h1 className="page-title max-w-3xl">
                  Tìm phòng trọ rõ ràng hơn, nhanh hơn và bớt mệt hơn.
                </h1>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link className="button-primary" to="/rooms">
                  Xem danh sách phòng
                  <Icon className="h-4 w-4" name="arrow-right" />
                </Link>
                <Link className="button-secondary" to="/rent">
                  Đăng tin cho thuê
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {siteStats.map((item) => (
                  <div key={item.label} className="metric-card">
                    <p className="text-2xl font-extrabold text-[color:var(--brand)]">{item.value}</p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="panel-soft flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-[color:var(--brand)]">
                    Hỗ trợ đúng nhu cầu
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                    Dễ dàng tìm kiếm, so sánh và lựa chọn phòng trọ phù hợp tại Huế.
                  </p>
                </div>
                <div className="pill-tag bg-[color:var(--accent-soft)] text-[color:var(--brand)]">
                  Dùng mượt trên điện thoại và máy tính
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="panel relative overflow-hidden p-5 sm:p-7">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(243,181,72,0.26),transparent_32%)]" />
                <div className="relative grid gap-5">
                  <div className="overflow-hidden rounded-[1.75rem]">
                      <img
                        alt="Không gian phòng trọ cho sinh viên"
                        className="h-[340px] w-full object-cover"
                        src={loftRoomImage}
                      />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-[0.95fr_1.05fr]">
                    <div className="panel-soft p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--brand)]">
                        Gợi ý nổi bật
                      </p>
                      <p className="mt-3 text-lg font-bold">Phòng khép kín gần trường, có wifi và chỗ để xe.</p>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                        Phù hợp với sinh viên cần di chuyển ít và muốn xem phòng trong ngày.
                      </p>
                    </div>
                    <div className="overflow-hidden rounded-[1.5rem]">
                      <img
                        alt="Sinh viên tham khảo phòng trọ"
                        className="h-full min-h-44 w-full object-cover"
                        src={cozyRoomImage}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="panel-soft flex items-center gap-4 p-4">
                      <div className="rounded-2xl bg-[color:var(--sky)] p-3 text-[color:var(--brand)]">
                        <Icon className="h-5 w-5" name="shield" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Tin đăng rõ thông tin</p>
                        <p className="mt-1 text-sm text-[color:var(--muted)]">Giảm cảm giác phải hỏi đi hỏi lại.</p>
                      </div>
                    </div>
                    <div className="panel-soft flex items-center gap-4 p-4">
                      <div className="rounded-2xl bg-[color:var(--accent-soft)] p-3 text-[color:var(--brand)]">
                        <Icon className="h-5 w-5" name="handshake" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Kết nối nhanh hơn</p>
                        <p className="mt-1 text-sm text-[color:var(--muted)]">Ưu tiên phòng có nhu cầu thật và phản hồi nhanh.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-space pt-6">
        <div className="shell">
          <div className="panel grid gap-10 px-6 py-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10">
            <div className="overflow-hidden rounded-[1.75rem]">
              <img alt="Tìm kiếm phòng trọ sinh viên" className="h-full w-full object-cover" src={cozyRoomImage} />
            </div>
            <div className="space-y-6">
              <SectionHeader
                eyebrow="Tại sao chọn Trọ Sinh Viên Huế"
                title="Tìm phòng nhanh hơn, thông tin rõ ràng hơn."
                description="Giá thuê, khu vực, tiện ích và cách liên hệ được hiển thị rõ để bạn chọn phòng nhanh hơn."
              />
              <div className="grid gap-5 sm:grid-cols-2">
                {homeFeatures.map((feature) => (
                  <div key={feature.title} className="panel-soft p-5">
                    <div className="mb-4 inline-flex rounded-2xl bg-[color:var(--sky)] p-3 text-[color:var(--brand)]">
                      <Icon className="h-5 w-5" name={feature.icon} />
                    </div>
                    <h2 className="text-lg font-bold text-[color:var(--ink)]">{feature.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="shell space-y-8">
          <SectionHeader
            action={
              <Link className="button-secondary" to="/rooms">
                Xem tất cả
              </Link>
            }
            description="Khám phá những phòng trọ được quan tâm nhiều, giúp bạn có thêm lựa chọn phù hợp."
            eyebrow="Phòng nổi bật"
            title="Một vài phòng đang được xem nhiều"
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {featuredRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="panel-muted overflow-hidden p-6 sm:p-8">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[color:var(--brand)]">
                Dành cho người mới tìm phòng
              </p>
              <h3 className="mt-4 font-display text-3xl text-[color:var(--ink)]">
                Bắt đầu từ khu vực, rồi mới lọc giá và tiện ích.
              </h3>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
                Ưu tiên chọn khu vực, ngân sách và tiện ích cần thiết để nhanh chóng tìm được phòng phù hợp.
              </p>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-[color:var(--line)]">
              <img alt="Phòng trọ trống phù hợp sinh viên mới" className="h-full min-h-72 w-full object-cover" src={simpleRoomImage} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default HomePage;
