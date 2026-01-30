import express from "express";
import {
  getMeals,
  createMeal,
  updateMeal,
  deleteMeal,
  getDailySummary,
  getWeeklySummary
} from "../controllers/meal.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getMeals);
router.post("/", authMiddleware, createMeal);
router.put("/:id", authMiddleware, updateMeal);
router.delete("/:id", authMiddleware, deleteMeal);
router.get("/daily-summary", authMiddleware, getDailySummary);
router.get("/weekly-summary", authMiddleware, getWeeklySummary);

export default router;
