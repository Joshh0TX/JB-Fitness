import db from "../config/db.js";

export const getDashboardSummary = async (req, res) => {
  const userId = req.user.id;

  try {
    // ✅ Last 7 days metrics
    const [metrics] = await db.query(
      `SELECT date, calories, water_intake, workouts_completed
       FROM metrics
       WHERE user_id = ? 
       ORDER BY date DESC
       LIMIT 7`,
      [userId]
    );

    // ✅ Total workouts in last 7 days
    const [workouts] = await db.query(
      `SELECT COUNT(*) AS total_workouts, SUM(calories_burned) AS total_calories
       FROM workouts
       WHERE user_id = ? 
         AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [userId]
    );

    res.json({
      metrics,
      workouts: workouts[0]
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
