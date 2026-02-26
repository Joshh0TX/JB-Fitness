// routes/auth.routes.js (ESM version)

import express from "express";
import {
	registerUser,
	loginUser,
	verifyLoginOtp,
	resendLoginOtp,
	validateRegistrationEmail,
} from "../controllers/auth.controller.js";

const router = express.Router();

// POST /api/auth/register
router.post("/register", registerUser);

// POST /api/auth/validate-email
router.post("/validate-email", validateRegistrationEmail);

// POST /api/auth/login
router.post("/login", loginUser);

// POST /api/auth/verify-login-otp
router.post("/verify-login-otp", verifyLoginOtp);

// POST /api/auth/resend-login-otp
router.post("/resend-login-otp", resendLoginOtp);

export default router;