import prisma from "../../config/db.js";
import axios from "axios";

const toIsoDay = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

export const searchFoodsService = async (query) => {
  // Try USDA first
  const usdaApiKey = process.env.USDA_API_KEY || "";
  if (usdaApiKey) {
    try {
      const response = await axios.get("https://api.nal.usda.gov/fdc/v1/foods/search", {
        params: { query: query.trim(), pageSize: 10, api_key: usdaApiKey },
        timeout: 5000,
      });

      if (response.data?.foods?.length > 0) {
        return {
          foods: response.data.foods.map((food) => ({
            id: food.fdcId,
            food_name: food.description,
            serving_size: "100g",
            calories: food.foodNutrients?.find((n) => n.nutrientName === "Energy")?.value || 0,
            protein: food.foodNutrients?.find((n) => n.nutrientName === "Protein")?.value || 0,
            carbs: food.foodNutrients?.find((n) => n.nutrientName === "Carbohydrate, by difference")?.value || 0,
            fat: food.foodNutrients?.find((n) => n.nutrientName === "Total lipid (fat)")?.value || 0,
            source: "USDA",
          })),
          source: "USDA",
        };
      }
    } catch (err) {
      console.warn("USDA API error:", err.message);
    }
  }

  // Fallback to Nigerian foods DB
  const nigerianFoods = await prisma.nigerian_foods.findMany({
    where: { food_name: { contains: query.trim(), mode: "insensitive" } },
    take: 20,
  });

  if (nigerianFoods.length > 0) {
    return {
      foods: nigerianFoods.map((food) => ({ ...food, source: "Nigerian Foods Database" })),
      source: "Nigerian Foods Database",
    };
  }

  return { foods: [], source: "No foods found" };
};

export const getMealsService = async (userId) => {
  return prisma.meals.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    select: { id: true, name: true, calories: true, protein: true, carbs: true, fats: true, created_at: true },
  });
};

export const getDailySummaryService = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const result = await prisma.meals.aggregate({
    where: { user_id: userId, created_at: { gte: today, lt: tomorrow } },
    _sum: { calories: true, protein: true, carbs: true, fats: true },
    _count: true,
  });

  return {
    totalCalories: result._sum.calories || 0,
    totalProtein: result._sum.protein || 0,
    totalCarbs: result._sum.carbs || 0,
    totalFats: result._sum.fats || 0,
    mealsCount: result._count || 0,
  };
};

export const getWeeklySummaryService = async (userId) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const meals = await prisma.meals.findMany({
    where: { user_id: userId, created_at: { gte: sevenDaysAgo } },
    select: { calories: true, protein: true, carbs: true, fats: true, created_at: true },
  });

  const result = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const dayString = day.toISOString().split("T")[0];

    const dayMeals = meals.filter((m) => toIsoDay(m.created_at) === dayString);
    result.push({
      day: dayString,
      totalCalories: dayMeals.reduce((s, m) => s + (m.calories || 0), 0),
      totalProtein: dayMeals.reduce((s, m) => s + (m.protein || 0), 0),
      totalCarbs: dayMeals.reduce((s, m) => s + (m.carbs || 0), 0),
      totalFats: dayMeals.reduce((s, m) => s + (m.fats || 0), 0),
    });
  }

  return result;
};

export const createMealService = async (userId, { name, calories, protein, carbs, fats }) => {
  return prisma.meals.create({
    data: { user_id: userId, name, calories, protein, carbs, fats },
  });
};

export const updateMealService = async (userId, mealId, { name, calories, protein, carbs, fats }) => {
  const meal = await prisma.meals.findFirst({ where: { id: mealId, user_id: userId } });
  if (!meal) throw { status: 404, message: "Meal not found or not yours" };

  return prisma.meals.update({
    where: { id: mealId },
    data: { name, calories, protein, carbs, fats },
  });
};

export const deleteMealService = async (userId, mealId) => {
  const meal = await prisma.meals.findFirst({ where: { id: mealId, user_id: userId } });
  if (!meal) throw { status: 404, message: "Meal not found or not yours" };

  return prisma.meals.delete({ where: { id: mealId } });
};