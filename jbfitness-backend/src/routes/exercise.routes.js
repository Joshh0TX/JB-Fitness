import express from "express";
import {
  searchExercises,
  calculateWorkoutCalories,
} from "../controllers/exercise.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Search for exercises
router.post("/search", searchExercises);

// Calculate calories burned
router.post("/calculate-calories", authMiddleware, calculateWorkoutCalories);

export default router;
