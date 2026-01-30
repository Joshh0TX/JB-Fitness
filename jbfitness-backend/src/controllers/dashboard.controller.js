import db from "../config/db.js";

export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // 🔹 Today's metrics
    const [todayMetrics] = await db.query(
      `
      SELECT 
        COALESCE(SUM(calories), 0) AS calories,
        COALESCE(SUM(workouts_completed), 0) AS workouts,
        COALESCE(SUM(water_intake), 0) AS water
      FROM metrics
      WHERE user_id = ? AND date = CURDATE()
      `,
      [userId]
    );

    // 🔹 Weekly calories (last 7 days)
    const [weekly] = await db.query(
      `
      SELECT date, SUM(calories) AS calories
      FROM metrics
      WHERE user_id = ?
        AND date >= CURDATE() - INTERVAL 6 DAY
      GROUP BY date
      ORDER BY date ASC
      `,
      [userId]
    );

    // Fill missing days with 0
    const weeklyProgress = Array(7).fill(0);
    weekly.forEach((row, index) => {
      weeklyProgress[index] = row.calories;
    });

    res.json({
      calories: todayMetrics[0].calories,
      workouts: todayMetrics[0].workouts,
      water: todayMetrics[0].water,
      weeklyProgress
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


    export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const [summary] = await db.query(
      `
      SELECT 
        COALESCE(SUM(calories), 0) AS totalCalories,
        COALESCE(SUM(water_intake), 0) AS totalWater,
        COALESCE(SUM(workouts_completed), 0) AS totalWorkouts
      FROM metrics
      WHERE user_id = ?
      `,
      [userId]
    );

    res.json(summary[0]);
  } catch (error) {
    console.error("Dashboard summary error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
