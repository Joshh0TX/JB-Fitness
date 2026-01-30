import db from "../config/db.js";

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
