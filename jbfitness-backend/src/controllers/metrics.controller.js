import db from "../config/db.js";

// GET metrics for a user (optionally by date or date range)
export const getMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query; // optional query parameters

    let query = "SELECT * FROM metrics WHERE user_id = ?";
    const params = [userId];

    if (startDate && endDate) {
      query += " AND date BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }

    query += " ORDER BY date DESC";

    const [metrics] = await db.query(query, params);
    res.json(metrics);
  } catch (error) {
    console.error("ERROR in getMetrics:", error);
    res.status(500).json({ message: error.message });
  }
};

// POST a new metric entry
export const createMetric = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, calories, water_intake, workouts_completed } = req.body;

    const [result] = await db.query(
      "INSERT INTO metrics (user_id, date, calories, water_intake, workouts_completed) VALUES (?, ?, ?, ?, ?)",
      [userId, date, calories || 0, water_intake || 0, workouts_completed || 0]
    );

    res.status(201).json({
      id: result.insertId,
      user_id: userId,
      date,
      calories: calories || 0,
      water_intake: water_intake || 0,
      workouts_completed: workouts_completed || 0,
    });
  } catch (error) {
    console.error("ERROR in createMetric:", error);
    res.status(500).json({ message: error.message });
  }
};

// PUT update a metric entry by ID
export const updateMetric = async (req, res) => {
  try {
    const userId = req.user.id;
    const metricId = req.params.id;
    const { calories, water_intake, workouts_completed } = req.body;

    const [result] = await db.query(
      "UPDATE metrics SET calories = ?, water_intake = ?, workouts_completed = ? WHERE id = ? AND user_id = ?",
      [calories, water_intake, workouts_completed, metricId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Metric not found" });
    }

    res.json({ message: "Metric updated successfully" });
  } catch (error) {
    console.error("ERROR in updateMetric:", error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE a metric entry by ID (optional)
export const deleteMetric = async (req, res) => {
  try {
    const userId = req.user.id;
    const metricId = req.params.id;

    const [result] = await db.query(
      "DELETE FROM metrics WHERE id = ? AND user_id = ?",
      [metricId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Metric not found" });
    }

    res.json({ message: "Metric deleted successfully" });
  } catch (error) {
    console.error("ERROR in deleteMetric:", error);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/metrics/water - increment today's water intake by 1 (upsert)
export const incrementWater = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if a metrics row exists for today
    const [rows] = await db.query("SELECT id, water_intake FROM metrics WHERE user_id = ? AND date = CURDATE()", [userId]);

    if (rows && rows.length > 0) {
      const metricId = rows[0].id;
      await db.query("UPDATE metrics SET water_intake = water_intake + 1 WHERE id = ? AND user_id = ?", [metricId, userId]);

      const [updated] = await db.query("SELECT water_intake FROM metrics WHERE id = ?", [metricId]);
      return res.status(200).json({ water: updated[0].water_intake });
    }

    // Insert a new metric row for today with water_intake = 1
    const [result] = await db.query(
      "INSERT INTO metrics (user_id, date, calories, water_intake, workouts_completed) VALUES (?, CURDATE(), 0, 1, 0)",
      [userId]
    );

    return res.status(201).json({ water: 1, id: result.insertId });
  } catch (error) {
    console.error("Increment water error:", error);
    res.status(500).json({ message: "Failed to increment water" });
  }
};
