import db from "../config/db.js";

/**
 * GET /api/metrics
 */
export const getMetrics = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM metrics WHERE user_id = ? ORDER BY date DESC",
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error("Get metrics error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/metrics
 */
export const createMetric = async (req, res) => {
  const userId = req.user.id;
  const { date, calories = 0, water_intake = 0, workouts_completed = 0 } = req.body;

  if (!date) {
    return res.status(400).json({ message: "Date is required" });
  }

  try {
    // Check if metric already exists for date
    const [existing] = await db.query(
      "SELECT id FROM metrics WHERE user_id = ? AND date = ?",
      [userId, date]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "Metrics already exist for this date"
      });
    }

    const [result] = await db.query(
      `INSERT INTO metrics 
       (user_id, date, calories, water_intake, workouts_completed)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, date, calories, water_intake, workouts_completed]
    );

    res.status(201).json({
      message: "Metrics created successfully",
      metricId: result.insertId
    });
  } catch (error) {
    console.error("Create metric error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/metrics/:id
 */
export const updateMetric = async (req, res) => {
  const { id } = req.params;
  const { calories, water_intake, workouts_completed } = req.body;

  // 🔹 DEBUG LOGS: Check values before updating
  console.log("Updating metric ID:", id);
  console.log("User ID from token:", req.user.id);
  console.log("Body payload:", req.body);

  try {
    const [result] = await db.query(
      `UPDATE metrics
       SET calories = ?, water_intake = ?, workouts_completed = ?
       WHERE id = ? AND user_id = ?`,
      [calories, water_intake, workouts_completed, id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Metric not found" });
    }

    res.json({ message: "Metric updated successfully" });
  } catch (error) {
    console.error("Update metric error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

