// controllers/auth.controller.js (ESM version)

import db from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../services/email.service.js";
import dns from "dns/promises";
import nodemailer from "nodemailer";

const LOGIN_OTP_TTL_MS = 10 * 60 * 1000;
const LOGIN_OTP_TTL_SECONDS = Math.floor(LOGIN_OTP_TTL_MS / 1000);
const RESET_OTP_TTL_MS = 10 * 60 * 1000;
const RESET_OTP_TTL_SECONDS = Math.floor(RESET_OTP_TTL_MS / 1000);
const AUTH_TOKEN_EXPIRES_IN = String(process.env.JWT_EXPIRES_IN || "7d").trim() || "7d";
const EMAIL_SEND_TIMEOUT_MS = Number(process.env.EMAIL_SEND_TIMEOUT_MS || 20000);
const EMAIL_NOT_CONFIGURED_MESSAGE =
  "Email service is not configured. Please set SMTP_HOST/SMTP_USER/SMTP_PASS/SMTP_FROM.";

const smtpService = String(process.env.SMTP_SERVICE || "").trim().toLowerCase();
const smtpHost = String(process.env.SMTP_HOST || "").trim();
const smtpResolvedHost = smtpHost || (smtpService === "gmail" ? "smtp.gmail.com" : "");
const smtpPort = Number(process.env.SMTP_PORT || (smtpService === "gmail" ? 587 : 587));
const smtpSecure =
  String(process.env.SMTP_SECURE || (smtpPort === 465 ? "true" : "false")).toLowerCase() ===
  "true";
const smtpUser = String(process.env.SMTP_USER || "").trim();
const smtpPass = String(process.env.SMTP_PASS || "").trim();
const smtpFrom = String(process.env.SMTP_FROM || smtpUser).trim();
const smtpAuthConfigured = Boolean(smtpUser && smtpPass);
const smtpConnectionTimeout = Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 15000);
const smtpGreetingTimeout = Number(process.env.SMTP_GREETING_TIMEOUT_MS || 15000);
const smtpSocketTimeout = Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 20000);
const smtpForceIpv4 = String(process.env.SMTP_FORCE_IPV4 || "true").toLowerCase() !== "false";

const mailTransporter = nodemailer.createTransport({
  host: smtpResolvedHost,
  port: smtpPort,
  secure: smtpSecure,
  requireTLS: !smtpSecure,
  family: smtpForceIpv4 ? 4 : undefined,
  connectionTimeout: smtpConnectionTimeout,
  greetingTimeout: smtpGreetingTimeout,
  socketTimeout: smtpSocketTimeout,
  tls: smtpResolvedHost
    ? {
        servername: smtpResolvedHost,
        minVersion: "TLSv1.2",
      }
    : undefined,
  auth: smtpAuthConfigured
    ? {
        user: smtpUser,
        pass: smtpPass,
      }
    : undefined,
});

const isEmailServiceConfigured = () => {
  const hasProvider = Boolean(smtpResolvedHost);
  return Boolean(hasProvider && smtpAuthConfigured && smtpFrom);
};

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const isObjectPayload = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getUserPasswordHash = (user = {}) => {
  return user.password || user.password_hash || null;
};

const resolvePasswordColumnName = async () => {
  const [rows] = await db.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'users'
       AND column_name ILIKE 'password%'
     ORDER BY ordinal_position ASC
     LIMIT 1`
  );

  return rows.length > 0 ? rows[0].column_name : "password";
};

const withTimeout = (promise, timeoutMs, timeoutMessage) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    }),
  ]);
};

const isValidEmailSyntax = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const createLoginChallengeToken = ({ userId, username, email, otp }) => {
  return jwt.sign(
    {
      type: "login-otp",
      userId,
      username,
      email,
      otp,
    },
    process.env.JWT_SECRET,
    { expiresIn: LOGIN_OTP_TTL_SECONDS }
  );
};

const createPasswordResetChallengeToken = ({ userId, username, email, otp, passwordHash }) => {
  return jwt.sign(
    {
      type: "password-reset-otp",
      userId,
      username,
      email,
      otp,
      passwordHash,
    },
    process.env.JWT_SECRET,
    { expiresIn: RESET_OTP_TTL_SECONDS }
  );
};

const decodeLoginChallengeToken = (challengeId) => {
  if (!challengeId) {
    throw new Error("Invalid login challenge");
  }

  const payload = jwt.verify(challengeId, process.env.JWT_SECRET);
  if (!isObjectPayload(payload) || payload.type !== "login-otp") {
    throw new Error("Invalid login challenge");
  }

  return payload;
};

const decodePasswordResetChallengeToken = (challengeId) => {
  if (!challengeId) {
    throw new Error("Invalid password reset challenge");
  }

  const payload = jwt.verify(challengeId, process.env.JWT_SECRET);
  if (!isObjectPayload(payload) || payload.type !== "password-reset-otp") {
    throw new Error("Invalid password reset challenge");
  }

  return payload;
};

const doesEmailDomainExist = async (email) => {
  if (!isValidEmailSyntax(email)) return false;

  const domain = email.split("@")[1];
  if (!domain) return false;

  try {
    const mxRecords = await dns.resolveMx(domain);
    return Array.isArray(mxRecords) && mxRecords.length > 0;
  } catch {
    return false;
  }
};

const sendOtpEmail = async ({ email, otp, username }) => {
  if (!isEmailServiceConfigured()) {
    throw new Error(EMAIL_NOT_CONFIGURED_MESSAGE);
  }

  await withTimeout(
    mailTransporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: "JBFitness Sign-in Verification Code",
      text: `Hi ${username || "there"}, your JBFitness verification code is ${otp}. It expires in 10 minutes.`,
      html: `
        <p>Hi ${username || "there"},</p>
        <p>Your JBFitness verification code is:</p>
        <h2 style="letter-spacing:4px;">${otp}</h2>
        <p>This code expires in 10 minutes.</p>
      `,
    }),
    EMAIL_SEND_TIMEOUT_MS,
    "Email send timed out"
  );
};

const sendPasswordResetOtpEmail = async ({ email, otp, username }) => {
  if (!isEmailServiceConfigured()) {
    throw new Error(EMAIL_NOT_CONFIGURED_MESSAGE);
  }

  await withTimeout(
    mailTransporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: "JBFitness Password Reset Code",
      text: `Hi ${username || "there"}, your JBFitness password reset code is ${otp}. It expires in 10 minutes.`,
      html: `
        <p>Hi ${username || "there"},</p>
        <p>Your JBFitness password reset code is:</p>
        <h2 style="letter-spacing:4px;">${otp}</h2>
        <p>This code expires in 10 minutes.</p>
      `,
    }),
    EMAIL_SEND_TIMEOUT_MS,
    "Email send timed out"
  );
};

/* ---------------- REGISTER ---------------- */
export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!username || !normalizedEmail || !password) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  try {
    const emailExists = await doesEmailDomainExist(normalizedEmail);
    if (!emailExists) {
      return res.status(400).json({ msg: "Email doesn't exist" });
    }

    // Check if user already exists
    const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await db.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [username, normalizedEmail, hashedPassword]
    );

    // Generate JWT
    const token = jwt.sign(
      { id: result.insertId, username, email: normalizedEmail },

      process.env.JWT_SECRET,
      { expiresIn: AUTH_TOKEN_EXPIRES_IN }
    );

    res.status(201).json({
      msg: "User registered successfully",
      token,
      user: { id: result.insertId, username, email: normalizedEmail },
    });
  } catch (err) {
    console.error("Register ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

export const validateRegistrationEmail = async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body?.email);

  if (!normalizedEmail) {
    return res.status(400).json({ msg: "Email is required", exists: false });
  }

  const exists = await doesEmailDomainExist(normalizedEmail);

  if (!exists) {
    return res.status(400).json({ msg: "Email doesn't exist", exists: false });
  }

  return res.json({ msg: "Email is valid", exists: true });
};

/* ---------------- LOGIN ---------------- */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    return res.status(400).json({ msg: "Email and password are required" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [normalizedEmail]);

    if (rows.length === 0) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const user = rows[0];

    // Compare password
    const passwordHash = getUserPasswordHash(user);
    if (!passwordHash) {
      return res.status(500).json({ msg: "User password is not configured correctly" });
    }

    const isMatch = await bcrypt.compare(password, passwordHash);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const otp = generateOtp();
    const challengeId = createLoginChallengeToken({
      userId: user.id,
      username: user.name,
      email: user.email,
      otp,
    });

    await sendOtpEmail({ email: user.email, otp, username: user.name });

    return res.json({
      msg: "OTP sent to your email",
      requiresOtp: true,
      challengeId,
      email: user.email,
      expiresInMs: LOGIN_OTP_TTL_MS,
    });
  } catch (err) {
    console.error("Login ERROR:", err.message, err.stack);
    res.status(500).json({ msg: err.message || "Server error" });
  }
};

export const verifyLoginOtp = async (req, res) => {
  const { challengeId, otp } = req.body || {};

  if (!challengeId || !otp) {
    return res.status(400).json({ msg: "Challenge ID and OTP are required" });
  }

  let challenge;
  try {
    challenge = decodeLoginChallengeToken(challengeId);
  } catch (err) {
    if (err?.name === "TokenExpiredError") {
      return res.status(400).json({ msg: "OTP expired. Please sign in again." });
    }
    return res.status(400).json({ msg: "Verification session expired. Please sign in again." });
  }

  if (String(otp).trim() !== String(challenge.otp)) {
    return res.status(401).json({ msg: "Invalid OTP" });
  }

  const token = jwt.sign(
    { id: challenge.userId, username: challenge.username, email: challenge.email },
    process.env.JWT_SECRET,
    { expiresIn: AUTH_TOKEN_EXPIRES_IN }
  );

  return res.json({
    msg: "Login successful",
    token,
    user: { id: challenge.userId, username: challenge.username, email: challenge.email },
  });
};

export const resendLoginOtp = async (req, res) => {
  const { challengeId } = req.body || {};

  if (!challengeId) {
    return res.status(400).json({ msg: "Challenge ID is required" });
  }

  let challenge;
  try {
    challenge = decodeLoginChallengeToken(challengeId);
  } catch {
    return res.status(400).json({ msg: "Verification session expired. Please sign in again." });
  }

  const otp = generateOtp();
  const refreshedChallengeId = createLoginChallengeToken({
    userId: challenge.userId,
    username: challenge.username,
    email: challenge.email,
    otp,
  });

  try {
    await sendOtpEmail({ email: challenge.email, otp, username: challenge.username });
    return res.json({
      msg: "A new OTP has been sent",
      challengeId: refreshedChallengeId,
      expiresInMs: LOGIN_OTP_TTL_MS,
    });
  } catch (err) {
    console.error("Resend OTP ERROR:", err);
    return res.status(500).json({ msg: err.message || "Failed to resend OTP" });
  }
};

/* ---------------- FORGOT PASSWORD ---------------- */
export const forgotPassword = async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body?.email || "");

  if (!normalizedEmail) {
    return res.status(400).json({ msg: "Email is required" });
  }

  try {
    const [rows] = await db.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER(?)",
      [normalizedEmail]
    );

    // Always return same message for security (don't reveal if email exists)
    const successMsg = {
      msg: "If an account exists with that email, you will receive password reset instructions shortly.",
    };

    if (rows.length === 0) {
      return res.json(successMsg);
    }

    const userId = rows[0].id;
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.query(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [userId, token, expiresAt]
    );

    const emailSent = await sendPasswordResetEmail(normalizedEmail, token);
    if (!emailSent && process.env.NODE_ENV !== "production") {
      console.log("[DEV] SMTP not configured. Password reset token:", token);
      console.log("[DEV] Reset URL:", `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`);
    }

    if (!emailSent && process.env.NODE_ENV === "production") {
      return res.status(500).json({ msg: "We couldn't send reset instructions right now. Please try again shortly." });
    }

    res.json(successMsg);
  } catch (err) {
    console.error("Forgot password ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

/* ---------------- RESET PASSWORD ---------------- */
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body || {};

  if (!token || !newPassword) {
    return res.status(400).json({ msg: "Token and new password are required" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ msg: "Password must be at least 8 characters" });
  }

  try {
    const [rows] = await db.query(
      "SELECT user_id FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()",
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ msg: "Invalid or expired reset link. Please request a new one." });
    }

    const userId = rows[0].user_id;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Support both 'password' and 'password_hash' column names
    const pwdCol = await resolvePasswordColumnName();

    await db.query(`UPDATE users SET ${pwdCol} = ? WHERE id = ?`, [
      hashedPassword,
      userId,
    ]);
    await db.query("DELETE FROM password_reset_tokens WHERE token = ?", [token]);

    res.json({ msg: "Password reset successfully. You can now sign in." });
  } catch (err) {
    console.error("Reset password ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

export const requestPasswordResetOtp = async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body?.email || "");

  if (!normalizedEmail) {
    return res.status(400).json({ msg: "Email is required" });
  }

  if (!isValidEmailSyntax(normalizedEmail)) {
    return res.status(400).json({ msg: "Invalid email address" });
  }

  if (!isEmailServiceConfigured()) {
    return res.status(500).json({ msg: EMAIL_NOT_CONFIGURED_MESSAGE });
  }

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1", [normalizedEmail]);
    if (!rows.length) {
      return res.json({ msg: "If the email exists, an OTP has been sent." });
    }

    const user = rows[0];
    const passwordHash = getUserPasswordHash(user);
    if (!passwordHash) {
      return res.status(500).json({ msg: "User password is not configured correctly" });
    }

    const otp = generateOtp();
    const challengeId = createPasswordResetChallengeToken({
      userId: user.id,
      username: user.name,
      email: user.email,
      otp,
      passwordHash,
    });

    await sendPasswordResetOtpEmail({ email: user.email, otp, username: user.name });

    return res.json({
      msg: "OTP sent to your email",
      challengeId,
      email: user.email,
      expiresInMs: RESET_OTP_TTL_MS,
    });
  } catch (err) {
    console.error("Request password reset OTP ERROR:", err);
    return res.status(500).json({ msg: err.message || "Failed to send password reset OTP" });
  }
};

export const resendPasswordResetOtp = async (req, res) => {
  const { challengeId } = req.body || {};

  if (!challengeId) {
    return res.status(400).json({ msg: "Challenge ID is required" });
  }

  let challenge;
  try {
    challenge = decodePasswordResetChallengeToken(challengeId);
  } catch {
    return res.status(400).json({ msg: "Password reset session expired. Please request a new OTP." });
  }

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ? LIMIT 1", [challenge.userId]);
    if (!rows.length) {
      return res.status(400).json({ msg: "Password reset session is invalid." });
    }

    const user = rows[0];
    const passwordHash = getUserPasswordHash(user);
    if (!passwordHash) {
      return res.status(500).json({ msg: "User password is not configured correctly" });
    }

    if (passwordHash !== challenge.passwordHash) {
      return res.status(400).json({ msg: "Password reset session is no longer valid. Please request a new OTP." });
    }

    const otp = generateOtp();
    const refreshedChallengeId = createPasswordResetChallengeToken({
      userId: user.id,
      username: user.name,
      email: user.email,
      otp,
      passwordHash,
    });

    await sendPasswordResetOtpEmail({ email: user.email, otp, username: user.name });

    return res.json({
      msg: "A new OTP has been sent",
      challengeId: refreshedChallengeId,
      expiresInMs: RESET_OTP_TTL_MS,
    });
  } catch (err) {
    console.error("Resend password reset OTP ERROR:", err);
    return res.status(500).json({ msg: err.message || "Failed to resend password reset OTP" });
  }
};

export const resetPasswordWithOtp = async (req, res) => {
  const { challengeId, otp, newPassword } = req.body || {};

  if (!challengeId || !otp || !newPassword) {
    return res.status(400).json({ msg: "Challenge ID, OTP, and new password are required" });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ msg: "New password must be at least 6 characters" });
  }

  let challenge;
  try {
    challenge = decodePasswordResetChallengeToken(challengeId);
  } catch (err) {
    if (err?.name === "TokenExpiredError") {
      return res.status(400).json({ msg: "OTP expired. Please request a new one." });
    }
    return res.status(400).json({ msg: "Password reset session expired. Please request a new OTP." });
  }

  if (String(otp).trim() !== String(challenge.otp)) {
    return res.status(401).json({ msg: "Invalid OTP" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ? LIMIT 1", [challenge.userId]);
    if (!rows.length) {
      return res.status(400).json({ msg: "Invalid password reset session" });
    }

    const user = rows[0];
    const passwordHash = getUserPasswordHash(user);
    if (!passwordHash) {
      return res.status(500).json({ msg: "User password is not configured correctly" });
    }

    if (passwordHash !== challenge.passwordHash) {
      return res.status(400).json({ msg: "Password reset session is no longer valid. Please request a new OTP." });
    }

    const hashedPassword = await bcrypt.hash(String(newPassword), 10);
    const passwordColumn = await resolvePasswordColumnName();
    await db.query(`UPDATE users SET ${passwordColumn} = ? WHERE id = ?`, [hashedPassword, challenge.userId]);

    return res.json({ msg: "Password reset successful. You can now sign in." });
  } catch (err) {
    console.error("Reset password with OTP ERROR:", err);
    return res.status(500).json({ msg: err.message || "Failed to reset password" });
  }
};
 