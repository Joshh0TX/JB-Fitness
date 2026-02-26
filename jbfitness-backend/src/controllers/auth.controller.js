// controllers/auth.controller.js (ESM version)

import db from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dns from "dns/promises";
import nodemailer from "nodemailer";

const LOGIN_OTP_TTL_MS = 10 * 60 * 1000;
const LOGIN_OTP_TTL_SECONDS = Math.floor(LOGIN_OTP_TTL_MS / 1000);

const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
});

    const isEmailServiceConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const normalizeEmail = (email = "") => email.trim().toLowerCase();

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

const decodeLoginChallengeToken = (challengeId) => {
  const payload = jwt.verify(challengeId, process.env.JWT_SECRET);
  if (!payload || payload.type !== "login-otp") {
    throw new Error("Invalid login challenge");
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
    throw new Error("Email service is not configured");
  }

  await mailTransporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "JBFitness Sign-in Verification Code",
    text: `Hi ${username || "there"}, your JBFitness verification code is ${otp}. It expires in 10 minutes.`,
    html: `
      <p>Hi ${username || "there"},</p>
      <p>Your JBFitness verification code is:</p>
      <h2 style="letter-spacing:4px;">${otp}</h2>
      <p>This code expires in 10 minutes.</p>
    `,
  });
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
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, normalizedEmail, hashedPassword]
    );

    // Generate JWT
    const token = jwt.sign(
      { id: result.insertId, username, email: normalizedEmail },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
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
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    if (!isEmailServiceConfigured()) {
      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      return res.json({
        msg: "Login successful",
        token,
        user: { id: user.id, username: user.username, email: user.email },
        twoFactorBypassed: true,
      });
    }

    const otp = generateOtp();
    const challengeId = createLoginChallengeToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      otp,
    });

    await sendOtpEmail({ email: user.email, otp, username: user.username });

    res.json({
      msg: "Verification code sent to your email",
      requires2FA: true,
      challengeId,
      email: user.email,
      expiresInMs: LOGIN_OTP_TTL_MS,
    });
  } catch (err) {
    console.error("Login ERROR:", err);
    res.status(500).json({ msg: err.message || "Server error" });
  }
};

export const verifyLoginOtp = async (req, res) => {
  const { challengeId, otp } = req.body;

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
    { expiresIn: "1d" }
  );

  return res.json({
    msg: "Login successful",
    token,
    user: { id: challenge.userId, username: challenge.username, email: challenge.email },
  });
};

export const resendLoginOtp = async (req, res) => {
  const { challengeId } = req.body;

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
 