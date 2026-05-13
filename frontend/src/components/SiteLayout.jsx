import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import logoImage from "../assets/logo.png";
import { useAuth } from "../context/AuthContext.jsx";
import { mainNavigation } from "../data/siteData.js";
import FeedbackModal from "./FeedbackModal.jsx";
import { Icon } from "./Icons.jsx";

function navClass({ isActive }) {
  return [
    "relative transition-colors duration-200 hover:text-[color:var(--brand)] after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-[color:var(--brand)] after:transition-transform after:duration-200",
    isActive
      ? "text-[color:var(--brand)] after:scale-x-100"
      : "text-[color:var(--ink)] hover:after:scale-x-100"
  ].join(" ");
}

function getRoleLabel(role) {
  if (role === "LANDLORD") {
    return "Chủ trọ";
  }

  if (role === "ADMIN") {
    return "Quản trị viên";
  }

  return "Sinh viên";
}

function getManagementLinks(role) {
  if (role === "LANDLORD") {
    return [
      { label: "Xác minh tài khoản", to: "/dashboard/verification" },
      { label: "Quản lý phòng trọ", to: "/dashboard/rooms" },
      { label: "Quản lý bài đăng", to: "/dashboard/posts" },
      { label: "Nhắn tin", to: "/dashboard/messages" }
    ];
  }

  if (role === "ADMIN") {
    return [
      { label: "Xác minh tài khoản chủ trọ", to: "/dashboard/admin-verifications" },
      { label: "Quản lý bài đăng", to: "/dashboard/admin-posts" },
      { label: "Quản lý tài khoản người dùng", to: "/dashboard/users" },
      { label: "Xử lý báo cáo vi phạm", to: "/dashboard/reports" }
    ];
  }

  return [
    { label: "Nhắn tin", to: "/dashboard/messages" },
    { label: "Báo cáo của tôi", to: "/dashboard/reports" },
    { label: "Thông tin cá nhân", to: "/dashboard/profile" }
  ];
}

function GuestLinks({ onNavigate }) {
  return (
    <>
      <NavLink className={navClass} onClick={onNavigate} to="/login">
        Đăng nhập
      </NavLink>
      <NavLink className={navClass} onClick={onNavigate} to="/register">
        Đăng ký
      </NavLink>
    </>
  );
}

function ManagementDropdown({ onNavigate, role }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const links = getManagementLinks(role);
  const isDashboard = location.pathname.startsWith("/dashboard");

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div className="relative z-[300]" ref={dropdownRef}>
      <button
        className={`${navClass({ isActive: isDashboard })} flex items-center gap-2 rounded-full px-2 py-1 font-semibold`}
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        Danh mục quản lý
        <span className={`text-xs transition-transform ${isOpen ? "rotate-180" : ""}`}>⌄</span>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+1rem)] z-[1000] max-h-[70vh] w-80 overflow-y-auto rounded-[1.75rem] border border-[color:var(--line)] bg-white/98 p-3 text-sm shadow-[0_28px_80px_rgba(22,50,74,0.24)] backdrop-blur">
          <NavLink
            className="mb-1 block rounded-[1.15rem] px-4 py-3.5 font-extrabold text-[color:var(--ink)] transition hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--brand)]"
            onClick={() => {
              setIsOpen(false);
              onNavigate?.();
            }}
            to="/dashboard"
          >
            Tổng quan
          </NavLink>
          {links.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) => `block rounded-[1.15rem] px-4 py-3.5 font-extrabold transition ${isActive ? "bg-[color:var(--accent-soft)] text-[color:var(--brand)] shadow-[inset_0_0_0_1px_rgba(213,91,54,0.12)]" : "text-[color:var(--ink)] hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--brand)]"}`}
              onClick={() => {
                setIsOpen(false);
                onNavigate?.();
              }}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function UserLinks({ onLogout, user }) {
  return (
    <>
      <ManagementDropdown role={user.role} />
      <div className="rounded-full bg-white px-4 py-2 text-sm text-[color:var(--ink)] shadow-[0_10px_24px_rgba(22,50,74,0.06)]">
        <span className="font-bold">{user.fullName}</span>
        <span className="ml-2 text-[color:var(--muted)]">({getRoleLabel(user.role)})</span>
      </div>
      <button className="button-secondary px-4 py-2.5" onClick={onLogout} type="button">
        Đăng xuất
      </button>
    </>
  );
}

function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutDialog, setLogoutDialog] = useState(null);
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const [landlordGuideDialog, setLandlordGuideDialog] = useState(null);
  const topNavigation = user?.role === "ADMIN"
    ? mainNavigation.filter((item) => !["/contact", "/rent"].includes(item.to))
    : mainNavigation;

  useEffect(() => {
    if (!user || user.role !== "LANDLORD") return;
    if (user.verificationStatus === "VERIFIED") return;
    const storageKey = `landlordVerificationGuideSeen_${user.id || user.email}`;
    if (window.localStorage.getItem(storageKey)) return;
    setLandlordGuideDialog({
      type: "confirm",
      title: "Hoàn tất xác minh để đăng tin cho thuê",
      message: "Để đăng phòng trọ và tạo bài đăng cho thuê, bạn cần gửi hồ sơ xác minh tài khoản trước. Sau khi được quản trị viên duyệt, bạn có thể thêm phòng, tạo bài đăng và quản lý tin cho thuê.",
      confirmLabel: "Đi tới xác minh",
      cancelLabel: "Để sau",
      storageKey
    });
  }, [user]);

  function closeLandlordGuide() {
    if (landlordGuideDialog?.storageKey) {
      window.localStorage.setItem(landlordGuideDialog.storageKey, "1");
    }
    setLandlordGuideDialog(null);
  }

  function confirmLandlordGuide() {
    closeLandlordGuide();
    navigate("/dashboard/verification");
  }

  function requestLogout() {
    setLogoutDialog({
      type: "confirm",
      title: "Xác nhận đăng xuất",
      message: "Bạn có chắc chắn muốn đăng xuất không?",
      confirmLabel: "Đăng xuất",
      cancelLabel: "Hủy"
    });
  }

  function confirmLogout() {
    setLogoutDialog(null);
    logout();
    setMobileOpen(false);
  }

  return (
    <header className="shell relative z-[100] pt-4 sm:pt-5">
      <FeedbackModal dialog={logoutDialog} onClose={() => setLogoutDialog(null)} onConfirm={confirmLogout} />
      <FeedbackModal dialog={landlordGuideDialog} onClose={closeLandlordGuide} onConfirm={confirmLandlordGuide} />
      <div className="panel relative overflow-visible bg-[color:var(--surface-strong)]/92 backdrop-blur">
        <div className="flex items-center justify-between gap-4 border-b border-[color:var(--line)] px-5 py-4 sm:px-8">
          <NavLink className="flex items-center gap-4" to="/">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[color:var(--surface-soft)] p-2">
              <img alt="Trọ Sinh Viên Huế" className="h-full w-full object-contain" src={logoImage} />
            </div>
            <div>
              <p className="font-display text-xl text-[color:var(--ink)]">Trọ Sinh Viên Huế</p>
              <p className="text-sm text-[color:var(--muted)]">Tìm phòng rõ ràng, thuê trọ an tâm</p>
            </div>
          </NavLink>

          <div className="hidden items-center gap-6 lg:flex">
            <div className="flex items-center gap-2 rounded-full bg-[color:var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)]">
              <Icon className="h-4 w-4 text-[color:var(--brand)]" name="phone" />
              <span>Hotline: 0123 456 789</span>
            </div>
            <div className="flex items-center gap-5 text-sm font-semibold">
              {isAuthenticated ? <UserLinks onLogout={requestLogout} user={user} /> : <GuestLinks />}
            </div>
          </div>

          <button
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            className="inline-flex rounded-full border border-[color:var(--line)] p-3 text-[color:var(--ink)] lg:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            type="button"
          >
            <Icon className="h-5 w-5" name={mobileOpen ? "close" : "menu"} />
          </button>
        </div>

        <div className="hidden items-center justify-between px-8 py-5 lg:flex">
          <nav className="flex items-center gap-8 text-sm font-bold uppercase tracking-[0.18em]">
            {topNavigation.map((item) => (
              <NavLink key={item.to} className={navClass} end={item.to === "/"} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <NavLink className="button-primary" to="/rooms">
            Khám phá phòng
            <Icon className="h-4 w-4" name="arrow-right" />
          </NavLink>
        </div>

        {mobileOpen ? (
          <div className="space-y-6 border-t border-[color:var(--line)] bg-[color:var(--surface)] px-5 py-5 lg:hidden">
            <div className="grid gap-4 text-sm font-semibold">
              {isAuthenticated ? (
                <>
                  <div className="rounded-[1.25rem] bg-white px-4 py-3 text-[color:var(--ink)] shadow-[0_10px_24px_rgba(22,50,74,0.06)]">
                    <div className="font-bold">{user.fullName}</div>
                    <div className="mt-1 text-sm text-[color:var(--muted)]">{getRoleLabel(user.role)}</div>
                  </div>
                  <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white p-3 shadow-[0_10px_24px_rgba(22,50,74,0.06)]">
                    <p className="mb-2 px-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[color:var(--brand)]">Danh mục quản lý</p>
                    <NavLink className="block rounded-2xl px-3 py-2 font-bold text-[color:var(--ink)] hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--brand)]" onClick={() => setMobileOpen(false)} to="/dashboard">
                      Tổng quan
                    </NavLink>
                    {getManagementLinks(user.role).map((item) => (
                      <NavLink
                        key={item.to}
                        className={({ isActive }) => `block rounded-2xl px-3 py-2 font-bold transition ${isActive ? "bg-[color:var(--accent-soft)] text-[color:var(--brand)]" : "text-[color:var(--ink)] hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--brand)]"}`}
                        onClick={() => setMobileOpen(false)}
                        to={item.to}
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                  <button className="button-secondary justify-center" onClick={requestLogout} type="button">
                    Đăng xuất
                  </button>
                </>
              ) : (
                <GuestLinks onNavigate={() => setMobileOpen(false)} />
              )}
            </div>
            <div className="grid gap-4 text-sm font-bold uppercase tracking-[0.18em]">
              {topNavigation.map((item) => (
                <NavLink
                  key={item.to}
                  className={navClass}
                  end={item.to === "/"}
                  onClick={() => setMobileOpen(false)}
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function SiteFooter() {
  const { user } = useAuth();
  const footerNavigation = user?.role === "ADMIN" ? mainNavigation.filter((item) => item.to !== "/rent") : mainNavigation;

  return (
    <footer className="mt-16 bg-[color:var(--ink)] text-white">
      <div className="shell overflow-hidden rounded-t-[2.5rem] border border-white/8 border-b-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent)] px-4 py-14 sm:grid sm:grid-cols-2 sm:gap-10 lg:grid-cols-4">
        <div className="space-y-4">
          <p className="font-display text-2xl">Trọ Sinh Viên Huế</p>
          <p className="text-sm leading-7 text-slate-300">
            Nền tảng giúp sinh viên tìm phòng minh bạch hơn và giúp chủ trọ đăng tin rõ ràng,
            đúng người, đúng nhu cầu.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[color:var(--accent)]">
            Điều hướng
          </p>
          <div className="grid gap-3 text-sm text-slate-300">
            {footerNavigation.map((item) => (
              <NavLink key={item.to} className="transition hover:text-white" end={item.to === "/"} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[color:var(--accent)]">
            Hỗ trợ
          </p>
          <div className="grid gap-3 text-sm text-slate-300">
            {user?.role !== "ADMIN" ? (
              <NavLink className="transition hover:text-white" to="/rent">
                Hướng dẫn sử dụng
              </NavLink>
            ) : null}
            <NavLink className="transition hover:text-white" to="/rooms">
              Hướng dẫn tìm phòng
            </NavLink>
            <NavLink className="transition hover:text-white" to="/contact">
              Câu hỏi thường gặp
            </NavLink>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[color:var(--accent)]">
            Kết nối
          </p>
          <div className="grid gap-3 text-sm text-slate-300">
            <a className="transition hover:text-white" href="tel:0123456789">
              0123 456 789
            </a>
            <a className="transition hover:text-white" href="mailto:hello@trosinhvienhue.vn">
              hello@trosinhvienhue.vn
            </a>
            <p>54 Nguyễn Huệ, TP. Huế</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-sm text-slate-400">
        2026 Ban quyen thuoc ve Trọ Sinh Viên Huế.
      </div>
    </footer>
  );
}

function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsVisible(window.scrollY > 320);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <button
      aria-label="Cuon len dau trang"
      className="fixed bottom-6 right-6 z-50 inline-flex h-13 w-13 items-center justify-center rounded-full bg-[color:var(--brand)] text-white shadow-[0_18px_34px_rgba(213,91,54,0.32)] transition duration-200 hover:-translate-y-1 hover:bg-[color:var(--brand-dark)]"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      type="button"
    >
      <Icon className="h-5 w-5" name="arrow-up" />
    </button>
  );
}

function SiteLayout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <Outlet />
      </main>
      <SiteFooter />
      <ScrollToTopButton />
    </div>
  );
}

export default SiteLayout;


