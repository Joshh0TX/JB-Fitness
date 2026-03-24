import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getDashboardSummary } from "../controllers/dashboardController.js";

const router = express.Router();

// GET /api/dashboard/summary
router.get("/summary", authMiddleware, getDashboardSummary);

export default router;
