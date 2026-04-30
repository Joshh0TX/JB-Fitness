import {
  searchFoodsService,
  getMealsService,
  getDailySummaryService,
  getWeeklySummaryService,
  createMealService,
  updateMealService,
  deleteMealService,
} from "./meals.service.js";

export const searchFoods = async (req, res) => {
  const { query } = req.query;
  if (!query?.trim()) return res.status(400).json({ message: "Search query is required" });
  try {
    const data = await searchFoodsService(query);
    return res.json({ ...data, message: `Found ${data.foods.length} foods` });
  } catch (err) {
    console.error("Search foods error:", err);
    return res.status(500).json({ message: "Failed to search foods" });
  }
};

export const getMeals = async (req, res) => {
  try {
    const meals = await getMealsService(req.user.id);
    return res.json(meals);
  } catch (err) {
    console.error("Get meals error:", err);
    return res.status(500).json({ message: "Failed to fetch meals" });
  }
};

export const getDailySummary = async (req, res) => {
  try {
    const summary = await getDailySummaryService(req.user.id);
    return res.json(summary);
  } catch (err) {
    console.error("Daily summary error:", err);
    return res.status(500).json({ message: "Failed to fetch daily summary" });
  }
};

export const getWeeklySummary = async (req, res) => {
  try {
    const summary = await getWeeklySummaryService(req.user.id);
    return res.json(summary);
  } catch (err) {
    console.error("Weekly summary error:", err);
    return res.status(500).json({ message: "Failed to fetch weekly summary" });
  }
};

export const createMeal = async (req, res) => {
  const { name, calories, protein, carbs, fats } = req.body;
  if (!name || calories == null || protein == null || carbs == null || fats == null) {
    return res.status(400).json({ message: "Missing required meal fields" });
  }
  try {
    const meal = await createMealService(req.user.id, { name, calories, protein, carbs, fats });
    return res.status(201).json({ message: "Meal added successfully", mealId: meal.id });
  } catch (err) {
    console.error("Create meal error:", err);
    return res.status(500).json({ message: "Failed to add meal" });
  }
};

export const updateMeal = async (req, res) => {
  try {
    await updateMealService(req.user.id, Number(req.params.id), req.body);
    return res.json({ message: "Meal updated successfully" });
  } catch (err) {
    console.error("Update meal error:", err);
    return res.status(err.status || 500).json({ message: err.message || "Failed to update meal" });
  }
};

export const deleteMeal = async (req, res) => {
  try {
    await deleteMealService(req.user.id, Number(req.params.id));
    return res.json({ message: "Meal deleted successfully" });
  } catch (err) {
    console.error("Delete meal error:", err);
    return res.status(err.status || 500).json({ message: err.message || "Failed to delete meal" });
  }
};