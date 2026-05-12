function canSendEmail() {
  return Boolean(process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PASS);
}

function getTransporter() {
  if (!canSendEmail()) return null;

  let nodemailer;
  try {
    nodemailer = require("nodemailer");
  } catch (error) {
    console.warn("Nodemailer chưa được cài. Chạy: npm.cmd install trong thư mục backend.");
    return null;
  }

  const port = Number(process.env.MAIL_PORT || 587);
  const secure = String(process.env.MAIL_SECURE || "false").toLowerCase() === "true" || port === 465;

  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port,
    secure,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });
}

async function sendPasswordResetOtp(email, otp) {
  const transporter = getTransporter();
  const expiresMinutes = Number(process.env.RESET_OTP_EXPIRES_MINUTES || 5);

  if (!transporter) {
    console.log(`[DEV OTP] Reset password OTP for ${email}: ${otp}`);
    return { sent: false, devMode: true };
  }

  const from = process.env.MAIL_FROM || process.env.MAIL_USER;
  const subject = "Mã xác nhận đặt lại mật khẩu - Trọ Sinh Viên Huế";
  const text = `Mã xác nhận đặt lại mật khẩu của bạn là: ${otp}\nMã có hiệu lực trong ${expiresMinutes} phút.\nNếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#16324a">
      <h2>Đặt lại mật khẩu</h2>
      <p>Mã xác nhận đặt lại mật khẩu của bạn là:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:6px;color:#d55b36">${otp}</p>
      <p>Mã có hiệu lực trong <strong>${expiresMinutes} phút</strong>.</p>
      <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
    </div>
  `;

  await transporter.sendMail({ from, to: email, subject, text, html });
  return { sent: true, devMode: false };
}

module.exports = { canSendEmail, sendPasswordResetOtp };
