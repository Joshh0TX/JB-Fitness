// controllers/auth.controller.js (ESM version)

import db from "../config/db.js";
import bcrypt from "bcryptjs"; // bcryptjs works well with Node ESM
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../services/email.service.js";

/* ---------------- REGISTER ---------------- */
export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  try {
    // Check if user already exists
    const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await db.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );

    // Generate JWT
    const token = jwt.sign(
      { id: result.insertId, username, email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      msg: "User registered successfully",
      token,
      user: { id: result.insertId, username, email },
    });
  } catch (err) {
    console.error("Register ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

/* ---------------- LOGIN ---------------- */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: "Email and password are required" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const user = rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      msg: "Login successful",
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("Login ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

/* ---------------- FORGOT PASSWORD ---------------- */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ msg: "Email is required" });
  }

  try {
    const [rows] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email.trim()]
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

    const emailSent = await sendPasswordResetEmail(email.trim(), token);
    if (!emailSent && process.env.NODE_ENV !== "production") {
      console.log("[DEV] SMTP not configured. Password reset token:", token);
      console.log("[DEV] Reset URL:", `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`);
    }

    res.json(successMsg);
  } catch (err) {
    console.error("Forgot password ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

/* ---------------- RESET PASSWORD ---------------- */
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

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
    const [cols] = await db.query("SHOW COLUMNS FROM users LIKE 'password%'");
    const pwdCol = cols.length > 0 ? cols[0].Field : "password";

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
 