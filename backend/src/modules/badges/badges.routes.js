import express from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import { getUserBadges } from "./badges.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getUserBadges);

export default router;