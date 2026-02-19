import db from "../config/db.js";
import axios from "axios";

/**
 * SEARCH foods from USDA with fallback to Nigerian foods database
 */
export const searchFoods = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Step 1: Try USDA API first
    let foods = [];
    try {
      const usda_api_key = process.env.USDA_API_KEY || "";
      
      if (usda_api_key) {
        const usda_response = await axios.get(
          `https://api.nal.usda.gov/fdc/v1/foods/search`,
          {
            params: {
              query: query.trim(),
              pageSize: 10,
              api_key: usda_api_key,
            },
            timeout: 5000,
          }
        );

        if (usda_response.data && usda_response.data.foods && usda_response.data.foods.length > 0) {
          foods = usda_response.data.foods.map((food) => ({
            id: food.fdcId,
            food_name: food.description,
            serving_size: "100g",
            calories: food.foodNutrients?.find((n) => n.nutrientName === "Energy")?.value || 0,
            protein: food.foodNutrients?.find((n) => n.nutrientName === "Protein")?.value || 0,
            carbs: food.foodNutrients?.find((n) => n.nutrientName === "Carbohydrate, by difference")?.value || 0,
            fat: food.foodNutrients?.find((n) => n.nutrientName === "Total lipid (fat)")?.value || 0,
            source: "USDA",
          }));

          return res.status(200).json({
            foods,
            source: "USDA",
            message: `Found ${foods.length} foods from USDA`,
          });
        }
      }
    } catch (usda_error) {
      console.warn("USDA API error or no results:", usda_error.message);
    }

    // Step 2: Fallback to Nigerian foods database if USDA returns no results
    const nigerian_sql = `
      SELECT 
        id,
        food_name,
        serving_size,
        calories,
        protein,
        carbs,
        fat
      FROM nigerian_foods
      WHERE food_name LIKE ?
      LIMIT 20
    `;

    const connection = await db.getConnection();
    let nigerian_foods;
    try {
      [nigerian_foods] = await connection.execute(nigerian_sql, [`%${query.trim()}%`]);
    } finally {
      connection.release();
    }

    if (nigerian_foods && nigerian_foods.length > 0) {
      const mapped_foods = nigerian_foods.map((food) => ({
        id: food.id,
        food_name: food.food_name,
        serving_size: food.serving_size,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        source: "Nigerian Foods Database",
      }));

      return res.status(200).json({
        foods: mapped_foods,
        source: "Nigerian Foods Database",
        message: `Found ${mapped_foods.length} Nigerian foods`,
      });
    }

    // Step 3: Return empty if nothing found
    return res.status(200).json({
      foods: [],
      source: "No foods found",
      message: "No foods found in USDA or Nigerian database",
    });
  } catch (error) {
    console.error("Search foods error:", error);
    res.status(500).json({ message: "Failed to search foods", error: error.message });
  }
};

/**
 * GET all meals for the logged-in user
 */
export const getMeals = async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        id,
        name,
        calories,
        protein,
        carbs,
        fats,
        created_at
      FROM meals
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;

    const [meals] = await db.execute(sql, [userId]);

    res.status(200).json(meals);
  } catch (error) {
    console.error("Get meals error:", error);
    res.status(500).json({ message: "Failed to fetch meals", error: error.message });
  }
};

/**
 * GET daily summary (today's total macros and calories)
 */
export const getDailySummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT
        COALESCE(SUM(calories), 0) AS totalCalories,
        COALESCE(SUM(protein), 0) AS totalProtein,
        COALESCE(SUM(carbs), 0) AS totalCarbs,
        COALESCE(SUM(fats), 0) AS totalFats,
        COUNT(*) AS mealsCount
      FROM meals
      WHERE user_id = ?
        AND DATE(created_at) = CURDATE()
    `;

    const [rows] = await db.execute(sql, [userId]);

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Daily summary error:", error);
    res.status(500).json({ message: "Failed to fetch daily summary" });
  }
};

/**
 * GET weekly summary (last 7 days)
 */
export const getWeeklySummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT
        DATE(created_at) AS day,
        COALESCE(SUM(calories), 0) AS totalCalories,
        COALESCE(SUM(protein), 0) AS totalProtein,
        COALESCE(SUM(carbs), 0) AS totalCarbs,
        COALESCE(SUM(fats), 0) AS totalFats
      FROM meals
      WHERE user_id = ?
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `;

    const [rows] = await db.execute(sql, [userId]);

    // Ensure 7 days are always returned, even if empty
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      const dayString = day.toISOString().split("T")[0];

      const existing = rows.find((r) => r.day === dayString);
      result.push(
        existing || {
          day: dayString,
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFats: 0,
        }
      );
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Weekly summary error:", error);
    res.status(500).json({ message: "Failed to fetch weekly summary" });
  }
};

/**
 * CREATE a new meal
 */
export const createMeal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, calories, protein, carbs, fats } = req.body;

    // 🛑 Validate input (important)
    if (!name || calories == null || protein == null || carbs == null || fats == null) {
      return res.status(400).json({ message: "Missing required meal fields" });
    }

    const sql = `
      INSERT INTO meals
        (user_id, name, calories, protein, carbs, fats)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
      userId,
      name,
      calories,
      protein,
      carbs,
      fats,
    ]);

    res.status(201).json({
      message: "Meal added successfully",
      mealId: result.insertId,
    });
  } catch (error) {
    console.error("Create meal error:", error);
    res.status(500).json({ message: "Failed to add meal" });
  }
};


/**
 * UPDATE a meal by ID
 */
export const updateMeal = async (req, res) => {
  try {
    const userId = req.user.id;
    const mealId = req.params.id;
    const { name, calories, protein, carbs, fats } = req.body;

    const sql = `
      UPDATE meals
      SET name = ?, calories = ?, protein = ?, carbs = ?, fats = ?
      WHERE id = ? AND user_id = ?
    `;

    const [result] = await db.execute(sql, [name, calories, protein, carbs, fats, mealId, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Meal not found or not yours" });
    }

    res.status(200).json({ message: "Meal updated successfully" });
  } catch (error) {
    console.error("Update meal error:", error);
    res.status(500).json({ message: "Failed to update meal" });
  }
};

/**
 * DELETE a meal by ID
 */
export const deleteMeal = async (req, res) => {
  try {
    const userId = req.user.id;
    const mealId = req.params.id;

    const sql = `
      DELETE FROM meals
      WHERE id = ? AND user_id = ?
    `;

    const [result] = await db.execute(sql, [mealId, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Meal not found or not yours" });
    }

    res.status(200).json({ message: "Meal deleted successfully" });
  } catch (error) {
    console.error("Delete meal error:", error);
    res.status(500).json({ message: "Failed to delete meal" });
  }
};
