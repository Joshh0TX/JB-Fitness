import express from "express";
import { getUserBadges } from "../controllers/badges.controller.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get user's earned badges
router.get("/", authenticateToken, getUserBadges);

export default router;