import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell.jsx";
import FormField from "../components/FormField.jsx";
import { Icon } from "../components/Icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import PageIntro from "../components/PageIntro.jsx";

function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) return <Navigate replace to="/" />;

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    if (!formData.email.trim() || !formData.password.trim()) {
      setErrorMessage("Vui lòng nhập email và mật khẩu.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(formData);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(error.message || "Đăng nhập thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageIntro
        aside={<p>Đăng nhập để quản lý tài khoản, phòng yêu thích và các thao tác trong hệ thống.</p>}
        description="Truy cập tài khoản bằng email và mật khẩu đã đăng ký."
        eyebrow="Đăng nhập"
        title="Đăng nhập hệ thống"
      />

      <section className="section-space pt-4">
        <div className="shell max-w-3xl">
          <AuthShell
            badge="Tài khoản"
            description="Nhập thông tin tài khoản để tiếp tục sử dụng hệ thống."
            highlights={[]}
            title="Đăng nhập"
          >
            <form className="grid gap-5" onSubmit={handleSubmit}>
              <FormField
                autoComplete="email"
                icon={<Icon className="h-4 w-4" name="mail" />}
                label="Email"
                onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                placeholder="Nhập email"
                type="email"
                value={formData.email}
              />

              <FormField
                autoComplete="current-password"
                icon={<Icon className="h-4 w-4" name="lock" />}
                label="Mật khẩu"
                onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                placeholder="Nhập mật khẩu"
                type="password"
                value={formData.password}
              />

              <div className="flex justify-end text-sm text-[color:var(--muted)]">
                <Link className="font-semibold text-[color:var(--brand)]" to="/contact">Quên mật khẩu?</Link>
              </div>

              {errorMessage ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div> : null}

              <button className="button-primary w-full" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>

              <p className="text-center text-sm text-[color:var(--muted)]">
                Chưa có tài khoản? <Link className="font-bold text-[color:var(--brand)]" to="/register">Đăng ký ngay</Link>
              </p>
            </form>
          </AuthShell>
        </div>
      </section>
    </>
  );
}

export default LoginPage;
