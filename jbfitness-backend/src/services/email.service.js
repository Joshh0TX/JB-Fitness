// services/email.service.js
// Sends transactional emails (e.g. password reset) via nodemailer

import nodemailer from "nodemailer";

const isConfigured = () => {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

const createTransporter = () => {
  if (!isConfigured()) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send a password reset email.
 * @param {string} to - Recipient email
 * @param {string} resetToken - The reset token
 * @returns {Promise<boolean>} - True if sent successfully
 */
export const sendPasswordResetEmail = async (to, resetToken) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetUrl = `${frontendUrl.replace(/\/$/, "")}/reset-password?token=${resetToken}`;

  const subject = "Reset your JBFitness password";
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #2e7d32;">Reset your password</h2>
      <p>You requested a password reset for your JBFitness account.</p>
      <p>Click the button below to set a new password. This link expires in 1 hour.</p>
      <p style="margin: 28px 0;">
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #66bb6a, #4caf50); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset Password</a>
      </p>
      <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} JBFitness</p>
    </div>
  `;
  const text = `Reset your JBFitness password:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`;

  const transporter = createTransporter();
  if (!transporter) {
    console.warn("[Email] SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env");
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"JBFitness" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    return true;
  } catch (err) {
    console.error("[Email] Send failed:", err.message);
    return false;
  }
};

export { isConfigured };
