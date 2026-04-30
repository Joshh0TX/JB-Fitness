import { searchExercisesService, calculateCaloriesService } from "./exercise.service.js";

export const searchExercises = async (req, res) => {
  const { query } = req.body;
  if (!query?.trim()) return res.status(400).json({ message: "Search query is required" });
  try {
    const results = await searchExercisesService(query);
    return res.json({ message: "Found exercises", results });
  } catch (err) {
    console.error("Exercise search error:", err);
    return res.status(500).json({ message: "Search failed" });
  }
};

export const calculateWorkoutCalories = async (req, res) => {
  const { exerciseName } = req.body;
  if (!exerciseName) return res.status(400).json({ message: "Exercise name is required" });
  try {
    const calories = calculateCaloriesService(req.body);
    return res.json({ exerciseName, calories, message: `Estimated ${calories} calories burned` });
  } catch (err) {
    console.error("Calorie calculation error:", err);
    return res.status(500).json({ message: "Failed to calculate calories" });
  }
};