import express from "express";
import {
  getMetrics,
  incrementWater,
  createMetric,
  updateMetric,
  deleteMetric,
} from "../controllers/metrics.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getMetrics);
router.post("/", authMiddleware, createMetric);
router.post("/water", authMiddleware, incrementWater);
router.put("/:id", authMiddleware, updateMetric);
router.delete("/:id", authMiddleware, deleteMetric);

export default router;
