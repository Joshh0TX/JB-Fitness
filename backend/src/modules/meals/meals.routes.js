import express from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import {
  searchFoods,
  getMeals,
  getDailySummary,
  getWeeklySummary,
  createMeal,
  updateMeal,
  deleteMeal,
} from "./meals.controller.js";

const router = express.Router();

router.get("/search", authMiddleware, searchFoods);
router.get("/daily-summary", authMiddleware, getDailySummary);
router.get("/weekly-summary", authMiddleware, getWeeklySummary);
router.get("/", authMiddleware, getMeals);
router.post("/", authMiddleware, createMeal);
router.put("/:id", authMiddleware, updateMeal);
router.delete("/:id", authMiddleware, deleteMeal);

export default router;