import express from "express";
import {
  getDashboard,
  getDashboardSummary,
} from "../controllers/dashboard.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Existing dashboard route
router.get("/", authMiddleware, getDashboard);

// NEW summary route
router.get("/summary", authMiddleware, getDashboardSummary);

export default router;
