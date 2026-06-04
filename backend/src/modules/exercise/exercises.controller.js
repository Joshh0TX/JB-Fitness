import { searchExercisesService } from "./exercises.service.js";

export const searchExercises = async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ message: "Query required" });
  try {
    const results = await searchExercisesService(query);
    return res.json({ results });
  } catch (err) {
    console.error("Exercise search error:", err);
    return res.status(500).json({ message: "Search failed" });
  }
};