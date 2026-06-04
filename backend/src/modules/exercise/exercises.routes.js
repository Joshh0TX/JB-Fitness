import express from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import { searchExercises } from "./exercises.controller.js";

const router = express.Router();
router.post("/search", authMiddleware, searchExercises);


router.get("/all", authMiddleware, async (req, res) => {
  const exercises = await prisma.exercise.findMany({ take: 5 });
  res.json(exercises);
});
export default router;