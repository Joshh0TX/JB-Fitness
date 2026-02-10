import express from "express";
import {
  searchNutrition,
  getNutritionDetails,
} from "../controllers/nutritionix.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Search for foods and get basic nutrition info
// POST /api/nutrition/search
router.post("/search", searchNutrition);

// Get detailed nutrition info with quantity
// POST /api/nutrition/details
router.post("/details", getNutritionDetails);

export default router;
