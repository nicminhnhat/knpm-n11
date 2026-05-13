import { Link, Navigate } from "react-router-dom";
import { Icon } from "../components/Icons.jsx";
import PageIntro from "../components/PageIntro.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function StepCard({ actionLabel, index, text, title, to }) {
  return (
    <article className="panel-soft flex h-full flex-col gap-4 p-5 transition duration-200 hover:-translate-y-1 hover:border-[color:var(--brand)] hover:shadow-[0_22px_48px_rgba(22,50,74,0.12)]">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-lg font-extrabold text-[color:var(--brand)] shadow-[0_14px_30px_rgba(213,91,54,0.12)]">
          {index + 1}
        </span>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[color:var(--brand)]">Bước {index + 1}</p>
          <h3 className="mt-2 text-xl font-extrabold text-[color:var(--ink)]">{title}</h3>
        </div>
      </div>
      <p className="flex-1 text-sm leading-7 text-[color:var(--muted)]">{text}</p>
      {to ? (
        <Link className="inline-flex items-center gap-2 text-sm font-extrabold text-[color:var(--brand)]" to={to}>
          {actionLabel || "Mở ngay"}
          <Icon className="h-4 w-4" name="arrow-right" />
        </Link>
      ) : null}
    </article>
  );
}

function GuideGrid({ steps }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {steps.map((step, index) => (
        <StepCard key={`${step.title}-${index}`} {...step} index={index} />
      ))}
    </div>
  );
}

function ActionButtons({ actions }) {
  if (!actions?.length) return null;

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {actions.map((action, index) => (
        <Link key={action.to} className={index === 0 ? "button-primary" : "button-secondary"} to={action.to}>
          {action.label}
          {index === 0 ? <Icon className="h-4 w-4" name="arrow-right" /> : null}
        </Link>
      ))}
    </div>
  );
}

function GuideSection({ actions, description, eyebrow, steps, title }) {
  return (
    <section className="panel p-6 sm:p-8 lg:p-10">
      <SectionHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="mt-8">
        <GuideGrid steps={steps} />
      </div>
      <ActionButtons actions={actions} />
    </section>
  );
}

const guestStudentSteps = [
  {
    title: "Tìm phòng trọ",
    text: "Sinh viên có thể vào danh sách phòng để xem các phòng đang còn trống. Hãy dùng bộ lọc khu vực, giá thuê, loại phòng và tiện ích để rút ngắn thời gian tìm kiếm và chọn được phòng phù hợp hơn."
  },
  {
    title: "Xem chi tiết phòng",
    text: "Khi chọn một phòng, bạn nên xem kỹ hình ảnh, giá thuê, diện tích, địa chỉ, bản đồ, tiện ích và thông tin liên hệ của chủ trọ. Những thông tin này giúp bạn so sánh trước khi quyết định liên hệ."
  },
  {
    title: "Liên hệ chủ trọ",
    text: "Nếu quan tâm đến phòng, bạn có thể nhắn tin trực tiếp với chủ trọ để hỏi thêm về giờ xem phòng, tiền cọc, chi phí sinh hoạt hoặc tình trạng phòng hiện tại."
  },
  {
    title: "Báo cáo tin không phù hợp",
    text: "Nếu phát hiện bài đăng sai thông tin, hình ảnh không đúng thực tế hoặc có dấu hiệu lừa đảo, hãy gửi báo cáo để quản trị viên kiểm tra và xử lý kịp thời."
  }
];

const guestLandlordSteps = [
  {
    title: "Đăng ký tài khoản chủ trọ",
    text: "Chủ trọ cần tạo tài khoản và chọn đúng vai trò chủ trọ để sử dụng các chức năng đăng phòng. Sau khi đăng nhập, bạn sẽ có khu vực riêng để quản lý phòng, bài đăng và tin nhắn."
  },
  {
    title: "Gửi hồ sơ xác minh",
    text: "Trước khi đăng tin, chủ trọ cần gửi thông tin xác minh. Việc xác minh giúp tài khoản đáng tin cậy hơn và giúp sinh viên yên tâm khi liên hệ thuê phòng."
  },
  {
    title: "Thêm phòng trọ",
    text: "Sau khi được xác minh, bạn có thể thêm thông tin phòng gồm giá thuê, diện tích, địa chỉ, tiền cọc, chi phí điện nước, tiện ích và hình ảnh thực tế của phòng."
  },
  {
    title: "Tạo bài đăng cho thuê",
    text: "Chọn phòng đã thêm, viết tiêu đề và mô tả rõ ràng. Bài đăng sẽ được gửi để quản trị viên kiểm duyệt trước khi hiển thị công khai cho sinh viên xem."
  }
];

const studentSteps = [
  {
    title: "Tìm phòng phù hợp",
    text: "Vào danh sách phòng để xem các phòng trọ đang hiển thị. Bạn có thể lọc theo khu vực, khoảng giá, loại phòng và tiện ích mong muốn để tìm nơi ở phù hợp với nhu cầu."
  },
  {
    title: "Kiểm tra thông tin trước khi liên hệ",
    text: "Hãy xem kỹ hình ảnh, mô tả, giá thuê, tiền cọc, tiền điện nước, địa chỉ và bản đồ. Việc kiểm tra trước giúp bạn tránh mất thời gian với những phòng không phù hợp."
  },
  {
    title: "Nhắn tin với chủ trọ",
    text: "Khi muốn hỏi thêm hoặc hẹn xem phòng, bấm “Nhắn tin liên hệ” để trao đổi trực tiếp với chủ trọ trong hệ thống. Cuộc trò chuyện sẽ được lưu lại để bạn dễ theo dõi."
  },
  {
    title: "Đánh giá hoặc báo cáo",
    text: "Sau khi trải nghiệm, bạn có thể đánh giá phòng để người khác tham khảo. Nếu bài đăng có thông tin sai lệch hoặc không phù hợp, hãy gửi báo cáo để quản trị viên xử lý."
  }
];

const landlordSteps = [
  {
    title: "Xác minh tài khoản",
    text: "Chủ trọ cần gửi hồ sơ xác minh trước khi đăng phòng. Việc xác minh giúp tài khoản đáng tin cậy hơn và giúp sinh viên yên tâm khi liên hệ thuê trọ."
  },
  {
    title: "Chờ quản trị viên duyệt",
    text: "Sau khi gửi hồ sơ, quản trị viên sẽ kiểm tra thông tin. Khi hồ sơ được duyệt, bạn có thể bắt đầu thêm phòng và tạo bài đăng cho thuê."
  },
  {
    title: "Thêm phòng trọ",
    text: "Nhập đầy đủ thông tin phòng như tiêu đề, giá thuê, diện tích, địa chỉ, tiền cọc, chi phí điện nước, tiện ích và hình ảnh thực tế của phòng."
  },
  {
    title: "Tạo bài đăng cho thuê",
    text: "Chọn phòng đã tạo, viết tiêu đề và mô tả bài đăng rõ ràng. Bài đăng sau đó sẽ được gửi để quản trị viên kiểm duyệt trước khi hiển thị cho sinh viên."
  },
  {
    title: "Theo dõi tin nhắn",
    text: "Khi sinh viên quan tâm và nhắn tin, bạn có thể xem và phản hồi trong mục tin nhắn. Phản hồi nhanh giúp tăng cơ hội hẹn xem phòng thành công."
  }
];

function GuestGuide() {
  return (
    <div className="space-y-8">
      <GuideSection
        eyebrow="Dành cho sinh viên"
        title="Tìm phòng rõ ràng trước khi liên hệ"
        description="Các bước dưới đây giúp bạn xem đủ thông tin, so sánh phòng dễ hơn và liên hệ chủ trọ đúng lúc."
        steps={guestStudentSteps}
        actions={[
          { label: "Xem danh sách phòng", to: "/rooms" },
          { label: "Đăng ký tài khoản", to: "/register" },
          { label: "Đăng nhập", to: "/login" }
        ]}
      />
      <GuideSection
        eyebrow="Dành cho chủ trọ"
        title="Đăng tin cho thuê theo từng bước"
        description="Hoàn tất xác minh, thêm phòng và tạo bài đăng để sinh viên dễ tìm thấy phòng của bạn."
        steps={guestLandlordSteps}
        actions={[
          { label: "Đăng ký tài khoản", to: "/register" },
          { label: "Đăng nhập", to: "/login" }
        ]}
      />
    </div>
  );
}

function StudentGuide() {
  return (
    <GuideSection
      eyebrow="Dành cho sinh viên"
      title="Tìm và liên hệ phòng trọ thuận tiện hơn"
      description="Làm theo các bước dưới đây để chọn phòng phù hợp, kiểm tra thông tin và trao đổi với chủ trọ trong hệ thống."
      steps={studentSteps}
      actions={[
        { label: "Xem danh sách phòng", to: "/rooms" },
        { label: "Tin nhắn của tôi", to: "/dashboard/messages" }
      ]}
    />
  );
}

function LandlordGuide() {
  return (
    <GuideSection
      eyebrow="Dành cho chủ trọ"
      title="Quản lý phòng và đăng tin đúng quy trình"
      description="Các bước này giúp bài đăng của bạn rõ ràng hơn, đáng tin cậy hơn và dễ được sinh viên quan tâm."
      steps={landlordSteps}
      actions={[
        { label: "Xác minh tài khoản", to: "/dashboard/verification" },
        { label: "Quản lý phòng trọ", to: "/dashboard/rooms" },
        { label: "Quản lý bài đăng", to: "/dashboard/posts" },
        { label: "Tin nhắn", to: "/dashboard/messages" }
      ]}
    />
  );
}

function AdminNotice() {
  return (
    <section className="panel p-6 sm:p-8 lg:p-10">
      <SectionHeader
        eyebrow="Thông báo"
        title="Trang này dành cho sinh viên và chủ trọ"
        description="Tài khoản quản trị viên có thể quay về khu vực quản lý để kiểm duyệt bài đăng, xử lý báo cáo và quản lý người dùng."
      />
      <div className="mt-8">
        <Link className="button-primary" to="/dashboard">
          Về trang quản lý
          <Icon className="h-4 w-4" name="arrow-right" />
        </Link>
      </div>
    </section>
  );
}

function RentPage() {
  const { isAuthenticated, user } = useAuth();
  const isStudent = user?.role === "STUDENT";
  const isLandlord = user?.role === "LANDLORD";
  const isAdmin = user?.role === "ADMIN";

  if (isAdmin) {
    return <Navigate replace to="/dashboard" />;
  }

  const pageTitle = isStudent
    ? "Hướng dẫn dành cho sinh viên"
    : isLandlord
      ? "Hướng dẫn dành cho chủ trọ"
      : "Hướng dẫn sử dụng Trọ Sinh Viên Huế";
  const pageDescription = isStudent
    ? "Tìm phòng, xem thông tin chi tiết, nhắn tin và báo cáo tin chưa phù hợp trong vài bước đơn giản."
    : isLandlord
      ? "Xác minh tài khoản, thêm phòng, tạo bài đăng và theo dõi tin nhắn từ sinh viên một cách rõ ràng."
      : "Chọn hướng dẫn phù hợp với nhu cầu của bạn: tìm phòng để thuê hoặc đăng tin cho thuê.";

  return (
    <>
      <PageIntro
        aside={
          <div className="space-y-3">
            <p className="text-lg font-bold text-[color:var(--ink)]">Hướng dẫn nhanh</p>
            <p>Các bước được trình bày rõ ràng để bạn dễ làm theo khi sử dụng website.</p>
          </div>
        }
        description={pageDescription}
        eyebrow="Hướng dẫn sử dụng"
        title={pageTitle}
      />

      <section className="section-space pt-4">
        <div className="shell">
          {isAdmin ? <AdminNotice /> : !isAuthenticated ? <GuestGuide /> : isLandlord ? <LandlordGuide /> : <StudentGuide />}
        </div>
      </section>
    </>
  );
}

export default RentPage;
