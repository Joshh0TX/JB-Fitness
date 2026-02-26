// controllers/auth.controller.js (ESM version)

import db from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dns from "dns/promises";
import nodemailer from "nodemailer";

const LOGIN_OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const loginOtpChallenges = new Map();

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

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const isValidEmailSyntax = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) {
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

    const challengeId = crypto.randomUUID();
    const otp = generateOtp();
    const expiresAt = Date.now() + LOGIN_OTP_TTL_MS;

    loginOtpChallenges.set(challengeId, {
      userId: user.id,
      username: user.username,
      email: user.email,
      otp,
      expiresAt,
      attempts: 0,
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

  const challenge = loginOtpChallenges.get(challengeId);

  if (!challenge) {
    return res.status(400).json({ msg: "Verification session expired. Please sign in again." });
  }

  if (Date.now() > challenge.expiresAt) {
    loginOtpChallenges.delete(challengeId);
    return res.status(400).json({ msg: "OTP expired. Please sign in again." });
  }

  if (String(otp).trim() !== String(challenge.otp)) {
    challenge.attempts += 1;
    if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
      loginOtpChallenges.delete(challengeId);
      return res.status(429).json({ msg: "Too many invalid attempts. Please sign in again." });
    }

    loginOtpChallenges.set(challengeId, challenge);
    return res.status(401).json({ msg: "Invalid OTP" });
  }

  loginOtpChallenges.delete(challengeId);

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

  const challenge = loginOtpChallenges.get(challengeId);
  if (!challenge) {
    return res.status(400).json({ msg: "Verification session expired. Please sign in again." });
  }

  const otp = generateOtp();
  challenge.otp = otp;
  challenge.expiresAt = Date.now() + LOGIN_OTP_TTL_MS;
  challenge.attempts = 0;

  loginOtpChallenges.set(challengeId, challenge);

  try {
    await sendOtpEmail({ email: challenge.email, otp, username: challenge.username });
    return res.json({ msg: "A new OTP has been sent", expiresInMs: LOGIN_OTP_TTL_MS });
  } catch (err) {
    console.error("Resend OTP ERROR:", err);
    return res.status(500).json({ msg: err.message || "Failed to resend OTP" });
  }
};
 