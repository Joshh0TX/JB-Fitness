import express from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import {
  getWorkouts,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  getWeeklyWorkoutSummary,
  getTodayWalkingActivity,
} from "./workouts.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getWorkouts);
router.get("/weekly-summary", authMiddleware, getWeeklyWorkoutSummary);
router.get("/activity-summary", authMiddleware, getTodayWalkingActivity);
router.post("/start", authMiddleware, createWorkout);
router.put("/:id", authMiddleware, updateWorkout);
router.delete("/:id", authMiddleware, deleteWorkout);

export default router;