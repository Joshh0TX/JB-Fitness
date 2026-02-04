import express from "express";
import {
  getWorkouts,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  getWeeklyWorkoutSummary
} from "../controllers/workout.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getWorkouts);
router.get("/weekly-summary", authMiddleware, getWeeklyWorkoutSummary);
router.post("/start", authMiddleware, createWorkout);
router.put("/:id", authMiddleware, updateWorkout);
router.delete("/:id", authMiddleware, deleteWorkout);


export default router;
