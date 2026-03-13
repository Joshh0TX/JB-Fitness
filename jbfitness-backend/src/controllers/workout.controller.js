import db from "../config/db.js";

const parseDistanceKmFromTitle = (title = "") => {
  const text = String(title);
  const match = text.match(/(\d+(?:\.\d+)?)\s*(km|kilometers?|mi|miles?)/i);
  if (!match) return 0;

  const distance = Number(match[1] ?? 0);
  if (!Number.isFinite(distance) || distance <= 0) return 0;

  const unit = String(match[2] ?? "").toLowerCase();
  return unit.startsWith("mi") ? distance * 1.60934 : distance;
};

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
        "SELECT id, workouts_completed FROM metrics WHERE user_id = ? AND date = CURRENT_DATE",
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
          "INSERT INTO metrics (user_id, date, calories, water_intake, workouts_completed) VALUES (?, CURRENT_DATE, 0, 0, 1)",
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
        COUNT(*) AS "totalWorkouts",
        COALESCE(SUM(calories_burned), 0) AS "totalCalories"
      FROM workouts
      WHERE user_id = ?
        AND created_at >= CURRENT_DATE - INTERVAL '6 days'
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

export const getTodayWalkingActivity = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.execute(
      `
      SELECT title, duration, calories_burned
      FROM workouts
      WHERE user_id = ?
        AND created_at::date = CURRENT_DATE
        AND LOWER(title) LIKE '%walk%'
      `,
      [userId]
    );

    const totals = (rows ?? []).reduce(
      (acc, workout) => {
        const minutes = Number(workout?.duration ?? 0);
        const calories = Number(workout?.calories_burned ?? 0);
        const distanceKmFromTitle = parseDistanceKmFromTitle(workout?.title ?? "");
        const inferredDistanceKm = distanceKmFromTitle > 0 ? distanceKmFromTitle : (minutes / 60) * 5;

        acc.minutesWalked += Number.isFinite(minutes) ? minutes : 0;
        acc.caloriesBurned += Number.isFinite(calories) ? calories : 0;
        acc.distanceKm += Number.isFinite(inferredDistanceKm) ? inferredDistanceKm : 0;
        return acc;
      },
      { minutesWalked: 0, caloriesBurned: 0, distanceKm: 0 }
    );

    const roundedDistanceKm = Number(totals.distanceKm.toFixed(2));
    const estimatedSteps = Math.round(roundedDistanceKm * 1312);

    res.status(200).json({
      steps: estimatedSteps,
      caloriesBurned: Math.round(totals.caloriesBurned),
      distanceKm: roundedDistanceKm,
      minutesWalked: Math.round(totals.minutesWalked),
    });
  } catch (error) {
    console.error("Walking activity summary error:", error);
    res.status(500).json({ message: "Failed to fetch walking activity" });
  }
};

