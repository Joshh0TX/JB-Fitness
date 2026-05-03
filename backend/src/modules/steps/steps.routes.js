import express from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import { logSteps, getSteps, getTodaySteps } from "./steps.controller.js";

const router = express.Router();

router.post("/log", authMiddleware, logSteps);
router.get("/", authMiddleware, getSteps);
router.get("/today", authMiddleware, getTodaySteps);

export default router;