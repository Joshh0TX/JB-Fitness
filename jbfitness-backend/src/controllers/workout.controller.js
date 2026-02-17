import db from "../config/db.js";

// GET all workouts for logged-in user
export const getWorkouts = async (req, res) => {
  try {
    console.log("req.user:", req.user); // log the user object

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User ID missing in request" });
    }

    const userId = req.user.id;
    const [workouts] = await db.query(
      "SELECT * FROM workouts WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    console.log("Query result:", workouts);
    res.json(workouts);
  } catch (error) {
    console.error("ERROR in getWorkouts:", error);
    res.status(500).json({ message: error.message }); // show real error
  }
};




// POST a new workout
export const createWorkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, duration, calories_burned } = req.body;

    const [result] = await db.query(
      `
      INSERT INTO workouts 
      (user_id, title, duration, calories_burned, created_at)
      VALUES (?, ?, ?, ?, NOW())
      `,
      [userId, title, duration, calories_burned]
    );

    // After creating a workout, increment today's workouts_completed metric (upsert)
    try {
      const [rows] = await db.query(
        "SELECT id, workouts_completed FROM metrics WHERE user_id = ? AND date = CURDATE()",
        [userId]
      );

      if (rows && rows.length > 0) {
        const metricId = rows[0].id;
        await db.query(
          "UPDATE metrics SET workouts_completed = workouts_completed + 1 WHERE id = ? AND user_id = ?",
          [metricId, userId]
        );
      } else {
        await db.query(
          "INSERT INTO metrics (user_id, date, calories, water_intake, workouts_completed) VALUES (?, CURDATE(), 0, 0, 1)",
          [userId]
        );
      }
    } catch (metricErr) {
      console.error("Failed to update metrics after workout creation:", metricErr);
    }

    res.status(201).json({
      id: result.insertId,
      user_id: userId,
      title,
      duration,
      calories_burned,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// PUT update a workout by ID
export const updateWorkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const workoutId = req.params.id;
    const { title, duration, calories_burned } = req.body;

    const [result] = await db.query(
      "UPDATE workouts SET title = ?, duration = ?, calories_burned = ? WHERE id = ? AND user_id = ?",
      [title, duration, calories_burned, workoutId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Workout not found" });
    }

    res.json({ message: "Workout updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE a workout by ID
export const deleteWorkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const workoutId = req.params.id;

    const [result] = await db.query(
      "DELETE FROM workouts WHERE id = ? AND user_id = ?",
      [workoutId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Workout not found" });
    }

    res.json({ message: "Workout deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getWeeklyWorkoutSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        DATE(created_at) AS day,
        COUNT(*) AS totalWorkouts,
        COALESCE(SUM(calories_burned), 0) AS totalCalories
      FROM workouts
      WHERE user_id = ?
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(created_at)
      ORDER BY day
    `;

    const [rows] = await db.execute(sql, [userId]);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Weekly workout summary error:", error);
    res.status(500).json({ message: "Failed to fetch workout summary" });
  }
};

