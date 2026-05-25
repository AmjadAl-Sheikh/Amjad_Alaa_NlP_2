import nodemailer from "nodemailer";
import { logger } from "./logger";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const mailOptions = {
    from: `"المساعد الذكي - بوليتكنك فلسطين" <${process.env.EMAIL_USER}>`,
    to,
    subject: "رمز التحقق - المساعد الذكي لجامعة بوليتكنك فلسطين",
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #f8f9fa; padding: 20px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #1a472a; margin: 0;">جامعة بوليتكنك فلسطين</h2>
          <p style="color: #666; margin: 4px 0 0;">المساعد الذكي الأكاديمي</p>
        </div>
        <div style="background: white; border-radius: 10px; padding: 28px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <p style="color: #333; font-size: 16px; margin-bottom: 20px;">رمز التحقق الخاص بك:</p>
          <div style="background: #1a472a; color: white; font-size: 36px; font-weight: bold; letter-spacing: 12px; padding: 16px 24px; border-radius: 8px; display: inline-block;">
            ${code}
          </div>
          <p style="color: #888; font-size: 13px; margin-top: 20px;">صالح لمدة <strong>10 دقائق</strong> فقط</p>
          <p style="color: #aaa; font-size: 12px; margin-top: 8px;">إذا لم تطلب هذا الرمز، تجاهل هذا البريد</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info({ to }, "OTP email sent");
  } catch (err) {
    logger.error({ err, to }, "Failed to send OTP email");
    throw err;
  }
}
