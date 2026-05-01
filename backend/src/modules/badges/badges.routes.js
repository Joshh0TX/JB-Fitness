import express from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import { getBadgeProgress, getUserBadges } from "./badges.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getUserBadges);
router.get("/progress", authMiddleware, getBadgeProgress);

export default router;