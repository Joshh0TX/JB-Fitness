import express from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import { searchExercises, calculateWorkoutCalories } from "./exercise.controller.js";

const router = express.Router();

router.post("/search", searchExercises);
router.post("/calculate-calories", authMiddleware, calculateWorkoutCalories);

export default router;