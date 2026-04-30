import { searchNutritionService, getNutritionDetailsService, scanNutritionImageService } from "./nutrition.service.js";

export const searchNutrition = async (req, res) => {
  const { query } = req.body;
  if (!query?.trim()) return res.status(400).json({ message: "Search query is required" });
  try {
    const results = await searchNutritionService(query);
    if (!results.length) return res.status(404).json({ message: "No foods found", results: [] });
    return res.json({ message: "Found", results });
  } catch (err) {
    console.error("Nutrition search error:", err);
    return res.status(err.status || 500).json({ message: err.message || "Search failed" });
  }
};

export const getNutritionDetails = async (req, res) => {
  const { fdcId, quantity } = req.body;
  if (!fdcId) return res.status(400).json({ message: "fdcId is required" });
  try {
    const data = await getNutritionDetailsService(fdcId, quantity);
    return res.json(data);
  } catch (err) {
    console.error("Nutrition details error:", err);
    return res.status(err.status || 500).json({ message: err.message || "Failed to fetch food details" });
  }
};

export const scanNutritionImage = async (req, res) => {
  const { imageData } = req.body;
  if (!imageData) return res.status(400).json({ message: "Image is required" });
  try {
    const data = await scanNutritionImageService(imageData);
    return res.json({ message: "Found via AI image scan", ...data });
  } catch (err) {
    console.error("Scan nutrition error:", err);
    return res.status(err.status || 500).json({ message: err.message || "Failed to scan food image" });
  }
};