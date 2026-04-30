import express from "express";
import { searchNutrition, getNutritionDetails, scanNutritionImage } from "./nutrition.controller.js";

const router = express.Router();

router.post("/search", searchNutrition);
router.post("/scan", scanNutritionImage);
router.post("/details", getNutritionDetails);

export default router;