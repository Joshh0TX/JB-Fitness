import express from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import {
  getMetrics,
  createMetric,
  updateMetric,
  deleteMetric,
  incrementWater,
} from "./metrics.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getMetrics);
router.post("/", authMiddleware, createMetric);
router.post("/water", authMiddleware, incrementWater);
router.put("/:id", authMiddleware, updateMetric);
router.delete("/:id", authMiddleware, deleteMetric);

export default router;