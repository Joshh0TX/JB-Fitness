import express from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import { searchExercises } from "./exercises.controller.js";

const router = express.Router();
router.post("/search", authMiddleware, searchExercises);

export default router;