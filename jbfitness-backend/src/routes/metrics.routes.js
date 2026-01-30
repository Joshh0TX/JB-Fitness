import express from "express";
import {
  getMetrics,
  createMetric,
  updateMetric,
  deleteMetric,
} from "../controllers/metrics.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getMetrics);
router.post("/", authMiddleware, createMetric);
router.put("/:id", authMiddleware, updateMetric);
router.delete("/:id", authMiddleware, deleteMetric);

export default router;
