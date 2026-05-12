import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell.jsx";
import FormField from "../components/FormField.jsx";
import { Icon } from "../components/Icons.jsx";
import PageIntro from "../components/PageIntro.jsx";
import { forgotPassword, resetPassword, verifyResetOtp } from "../lib/api.js";

const STEPS = {
  EMAIL: "email",
  OTP: "otp",
  RESET: "reset",
  DONE: "done"
};

function StepBadge({ active, label, number }) {
  return (
    <div className={["flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold", active ? "bg-[color:var(--accent-soft)] text-[color:var(--brand)]" : "bg-white/70 text-[color:var(--muted)]"].join(" ")}>
      <span className={["grid h-6 w-6 place-items-center rounded-full", active ? "bg-[color:var(--brand)] text-white" : "bg-slate-100 text-[color:var(--muted)]"].join(" ")}>{number}</span>
      {label}
    </div>
  );
}

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [passwords, setPasswords] = useState({ newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearFeedback() {
    setMessage("");
    setErrorMessage("");
  }

  async function handleSendOtp(event) {
    event.preventDefault();
    clearFeedback();

    if (!email.trim()) {
      setErrorMessage("Vui lòng nhập email đã đăng ký.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await forgotPassword(email.trim());
      setMessage(result.message || "Nếu email tồn tại trong hệ thống, mã xác nhận đã được gửi.");
      setDevOtp(result.devOtp || "");
      setStep(STEPS.OTP);
    } catch (error) {
      setErrorMessage(error.message || "Không thể gửi mã xác nhận. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();
    clearFeedback();

    if (!/^\d{6}$/.test(otp.trim())) {
      setErrorMessage("Mã OTP phải gồm 6 chữ số.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await verifyResetOtp(email.trim(), otp.trim());
      setMessage(result.message || "Mã xác nhận hợp lệ.");
      setStep(STEPS.RESET);
    } catch (error) {
      setErrorMessage(error.message || "Mã xác nhận không đúng hoặc đã hết hạn.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    clearFeedback();

    if (passwords.newPassword.length < 6) {
      setErrorMessage("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await resetPassword(email.trim(), otp.trim(), passwords.newPassword, passwords.confirmPassword);
      setMessage(result.message || "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.");
      setStep(STEPS.DONE);
    } catch (error) {
      setErrorMessage(error.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageIntro
        aside={<p>Hệ thống chỉ sử dụng email để gửi mã xác nhận đặt lại mật khẩu.</p>}
        description="Nhập email đã đăng ký, xác nhận mã OTP và tạo mật khẩu mới."
        eyebrow="Quên mật khẩu"
        title="Khôi phục tài khoản"
      />

      <section className="section-space pt-4">
        <div className="shell max-w-3xl">
          <AuthShell
            badge="Bảo mật tài khoản"
            description="Quy trình đặt lại mật khẩu gồm 3 bước: nhận mã qua email, xác nhận OTP và nhập mật khẩu mới."
            highlights={[]}
            title="Đặt lại mật khẩu"
          >
            <div className="mb-6 flex flex-wrap gap-2">
              <StepBadge active={step === STEPS.EMAIL} label="Email" number="1" />
              <StepBadge active={step === STEPS.OTP} label="OTP" number="2" />
              <StepBadge active={step === STEPS.RESET || step === STEPS.DONE} label="Mật khẩu mới" number="3" />
            </div>

            {message ? <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</div> : null}
            {devOtp ? <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Mã OTP kiểm thử local: {devOtp}</div> : null}
            {errorMessage ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{errorMessage}</div> : null}

            {step === STEPS.EMAIL ? (
              <form className="grid gap-5" onSubmit={handleSendOtp}>
                <FormField
                  autoComplete="email"
                  icon={<Icon className="h-4 w-4" name="mail" />}
                  label="Email đã đăng ký"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Nhập email tài khoản"
                  type="email"
                  value={email}
                />
                <button className="button-primary w-full" disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Đang gửi mã..." : "Gửi mã xác nhận"}
                </button>
              </form>
            ) : null}

            {step === STEPS.OTP ? (
              <form className="grid gap-5" onSubmit={handleVerifyOtp}>
                <FormField
                  inputMode="numeric"
                  label="Mã OTP"
                  maxLength={6}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Nhập 6 chữ số"
                  value={otp}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <button className="button-secondary" onClick={() => setStep(STEPS.EMAIL)} type="button">Đổi email</button>
                  <button className="button-primary" disabled={isSubmitting} type="submit">
                    {isSubmitting ? "Đang xác nhận..." : "Xác nhận mã"}
                  </button>
                </div>
              </form>
            ) : null}

            {step === STEPS.RESET ? (
              <form className="grid gap-5" onSubmit={handleResetPassword}>
                <FormField
                  autoComplete="new-password"
                  icon={<Icon className="h-4 w-4" name="lock" />}
                  label="Mật khẩu mới"
                  onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))}
                  placeholder="Tối thiểu 6 ký tự"
                  type="password"
                  value={passwords.newPassword}
                />
                <FormField
                  autoComplete="new-password"
                  icon={<Icon className="h-4 w-4" name="lock" />}
                  label="Xác nhận mật khẩu mới"
                  onChange={(event) => setPasswords((current) => ({ ...current, confirmPassword: event.target.value }))}
                  placeholder="Nhập lại mật khẩu mới"
                  type="password"
                  value={passwords.confirmPassword}
                />
                <button className="button-primary w-full" disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
                </button>
              </form>
            ) : null}

            {step === STEPS.DONE ? (
              <div className="grid gap-4">
                <button className="button-primary w-full" onClick={() => navigate("/login", { replace: true })} type="button">
                  Quay lại đăng nhập
                </button>
              </div>
            ) : null}

            <p className="mt-6 text-center text-sm text-[color:var(--muted)]">
              Đã nhớ mật khẩu? <Link className="font-bold text-[color:var(--brand)]" to="/login">Đăng nhập</Link>
            </p>
          </AuthShell>
        </div>
      </section>
    </>
  );
}

export default ForgotPasswordPage;
