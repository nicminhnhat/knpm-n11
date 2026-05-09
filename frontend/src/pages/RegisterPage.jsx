import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell.jsx";
import FormField from "../components/FormField.jsx";
import { Icon } from "../components/Icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import PageIntro from "../components/PageIntro.jsx";

function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, register } = useAuth();
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "", confirmPassword: "", role: "STUDENT" });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) return <Navigate replace to="/" />;

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password.trim() || !formData.confirmPassword.trim()) {
      setErrorMessage("Vui lòng nhập đầy đủ thông tin đăng ký.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ fullName: formData.fullName, email: formData.email, password: formData.password, role: formData.role });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(error.message || "Đăng ký thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageIntro
        aside={<p>Tạo tài khoản để tìm phòng, lưu phòng yêu thích hoặc đăng tin cho thuê.</p>}
        description="Đăng ký tài khoản sinh viên hoặc chủ trọ để sử dụng đầy đủ chức năng."
        eyebrow="Đăng ký"
        title="Tạo tài khoản mới"
      />

      <section className="section-space pt-4">
        <div className="shell max-w-4xl">
          <AuthShell
            badge="Thành viên mới"
            description="Điền thông tin tài khoản để bắt đầu sử dụng hệ thống."
            highlights={[]}
            title="Đăng ký"
          >
            <form className="grid gap-5 lg:grid-cols-2" onSubmit={handleSubmit}>
              <FormField autoComplete="name" icon={<Icon className="h-4 w-4" name="user" />} label="Họ và tên" onChange={(event) => setFormData((current) => ({ ...current, fullName: event.target.value }))} placeholder="Nhập họ và tên" value={formData.fullName} />
              <FormField autoComplete="email" icon={<Icon className="h-4 w-4" name="mail" />} label="Email" onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))} placeholder="Ví dụ: name@gmail.com" type="email" value={formData.email} />
              <FormField autoComplete="new-password" icon={<Icon className="h-4 w-4" name="lock" />} label="Mật khẩu" onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))} placeholder="Tối thiểu 6 ký tự" type="password" value={formData.password} />
              <FormField autoComplete="new-password" icon={<Icon className="h-4 w-4" name="lock" />} label="Xác nhận mật khẩu" onChange={(event) => setFormData((current) => ({ ...current, confirmPassword: event.target.value }))} placeholder="Nhập lại mật khẩu" type="password" value={formData.confirmPassword} />

              <label className="grid gap-2 text-sm font-semibold text-[color:var(--ink)] lg:col-span-2">
                Vai trò
                <select className="input-shell" value={formData.role} onChange={(event) => setFormData((current) => ({ ...current, role: event.target.value }))}>
                  <option value="STUDENT">Sinh viên</option>
                  <option value="LANDLORD">Chủ trọ</option>
                </select>
              </label>

              {errorMessage ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 lg:col-span-2">{errorMessage}</div> : null}

              <button className="button-primary w-full lg:col-span-2" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
              </button>

              <p className="text-center text-sm text-[color:var(--muted)] lg:col-span-2">
                Đã có tài khoản? <Link className="font-bold text-[color:var(--brand)]" to="/login">Đăng nhập</Link>
              </p>
            </form>
          </AuthShell>
        </div>
      </section>
    </>
  );
}

export default RegisterPage;
