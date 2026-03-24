// routes/auth.routes.js (ESM version)

import express from "express";
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  verifyLoginOtp,
  resendLoginOtp,
  validateRegistrationEmail,
	requestPasswordResetOtp,
	resendPasswordResetOtp,
	resetPasswordWithOtp,
} from "../controllers/auth.controller.js";

const router = express.Router();

// POST /api/auth/register
router.post("/register", registerUser);

// POST /api/auth/validate-email
router.post("/validate-email", validateRegistrationEmail);

// POST /api/auth/login
router.post("/login", loginUser);

// POST /api/auth/forgot-password
router.post("/forgot-password", forgotPassword);

// POST /api/auth/reset-password
router.post("/reset-password", resetPassword);

// POST /api/auth/verify-login-otp
router.post("/verify-login-otp", verifyLoginOtp);

// POST /api/auth/resend-login-otp
router.post("/resend-login-otp", resendLoginOtp);

// POST /api/auth/request-password-reset-otp
router.post("/request-password-reset-otp", requestPasswordResetOtp);

// POST /api/auth/resend-password-reset-otp
router.post("/resend-password-reset-otp", resendPasswordResetOtp);

// POST /api/auth/reset-password-with-otp
router.post("/reset-password-with-otp", resetPasswordWithOtp);

export default router;