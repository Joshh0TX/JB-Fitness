import express from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import { getDashboard, getDashboardSummary } from "./dashboard.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getDashboard);
router.get("/summary", authMiddleware, getDashboardSummary);

export default router;