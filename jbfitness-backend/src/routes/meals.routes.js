import express from "express";
import {
  searchFoods,
  getMeals,
  createMeal,
  updateMeal,
  deleteMeal,
  getDailySummary,
  getWeeklySummary
} from "../controllers/meal.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/search", authMiddleware, searchFoods);
router.get("/", authMiddleware, getMeals);
router.post("/", authMiddleware, createMeal);
router.put("/:id", authMiddleware, updateMeal);
router.delete("/:id", authMiddleware, deleteMeal);
// Summary routes FIRST
router.get("/daily-summary", authMiddleware, getDailySummary);
router.get("/weekly-summary", authMiddleware, getWeeklySummary);

// Basic meal routes
router.get("/", authMiddleware, getMeals);
router.post("/", authMiddleware, createMeal);

// ID-based routes LAST
router.put("/:id", authMiddleware, updateMeal);
router.delete("/:id", authMiddleware, deleteMeal);

export default router;
