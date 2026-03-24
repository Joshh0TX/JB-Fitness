import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getMetrics,
  createMetric,
  updateMetric
} from "../controllers/metricsController.js";

const router = express.Router();

// GET all metrics for logged-in user
router.get("/", authMiddleware, getMetrics);

// POST create daily metric
router.post("/", authMiddleware, createMetric);

// PUT update metric by ID
router.put("/:id", authMiddleware, updateMetric);

export default router;
