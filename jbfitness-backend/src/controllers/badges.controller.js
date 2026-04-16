import db from "../config/db.js";

const parseDistanceKmFromTitle = (title = "") => {
  const text = String(title).toLowerCase();
  const match = text.match(/(\d+(?:\.\d+)?)\s*(km|kilometers?|mi|miles?)/i);
  if (!match) return 0;

  const distance = Number(match[1] ?? 0);
  if (!Number.isFinite(distance) || distance <= 0) return 0;

  return match[2].toLowerCase().startsWith("mi") ? distance * 1.60934 : distance;
};

const parseStepsFromTitle = (title = "") => {
  const text = String(title).toLowerCase();
  const match = text.match(/(\d{3,6})\s*steps?/i);
  if (!match) return 0;

  const steps = Number(match[1] ?? 0);
  return Number.isFinite(steps) && steps > 0 ? Math.round(steps) : 0;
};

const isStepEligibleWorkout = (title = "") => {
  const text = String(title).toLowerCase();
  return /walk|run|jog|hike|treadmill|steps?|cardio|km|kilometer|mile|mi\b/.test(text);
};

const inferStepsFromWorkout = (workout = {}) => {
  const title = String(workout.title || "");
  const minutes = Number(workout.duration || 0);
  const stepsFromTitle = parseStepsFromTitle(title);
  const distanceKm = parseDistanceKmFromTitle(title);

  if (!isStepEligibleWorkout(title)) return 0;
  if (stepsFromTitle > 0) return stepsFromTitle;
  if (distanceKm > 0) return Math.round(distanceKm * 1312);
  if (minutes > 0) return Math.round(minutes * 105);
  return 0;
};

const formatDateISO = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getWorkoutSteps = async (userId, startDate = null, endDate = null) => {
  let sql = "SELECT title, duration FROM workouts WHERE user_id = ?";
  const params = [userId];

  if (startDate && endDate) {
    sql += " AND DATE(created_at) BETWEEN ? AND ?";
    params.push(startDate, endDate);
  }

  const [workouts] = await db.query(sql, params);
  return (workouts || []).reduce((sum, workout) => sum + inferStepsFromWorkout(workout), 0);
};

export const getUserBadges = async (req, res) => {
  try {
    const userId = req.user.id;

    const [badges] = await db.query(
      `SELECT
        ub.id,
        b.name,
        b.description,
        b.icon,
        b.category,
        b.points,
        b.rarity,
        ub.earned_at
      FROM user_badges ub
      JOIN badges b ON ub.badge_id = b.id
      WHERE ub.user_id = ?
      ORDER BY ub.earned_at DESC`,
      [userId]
    );

    res.json({ badges });
  } catch (error) {
    console.error("Get user badges error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const checkAndAwardBadges = async (userId) => {
  try {
    // Get all badges user doesn't have yet
    const [availableBadges] = await db.query(
      `SELECT * FROM badges
       WHERE id NOT IN (
         SELECT badge_id FROM user_badges WHERE user_id = ?
       )`,
      [userId]
    );

    const newBadges = [];

    for (const badge of availableBadges) {
      let achieved = false;

      switch (badge.condition_type) {
        case "total":
          if (badge.category === "steps") {
            const totalSteps = await getWorkoutSteps(userId);
            achieved = totalSteps >= badge.condition_value;
          } else if (badge.category === "workouts") {
            const [result] = await db.query(
              "SELECT COUNT(*) as count FROM workouts WHERE user_id = ?",
              [userId]
            );
            achieved = result[0].count >= badge.condition_value;
          }
          break;

        case "daily":
          if (badge.category === "steps") {
            const today = formatDateISO(new Date());
            const dailySteps = await getWorkoutSteps(userId, today, today);
            achieved = dailySteps >= badge.condition_value;
          } else if (badge.category === "workouts") {
            const [result] = await db.query(
              "SELECT COUNT(*) as count FROM workouts WHERE user_id = ? AND DATE(created_at) = CURRENT_DATE",
              [userId]
            );
            achieved = result[0].count >= badge.condition_value;
          } else if (badge.category === "calories") {
            const [result] = await db.query(
              "SELECT COALESCE(SUM(calories), 0) as total FROM metrics WHERE user_id = ? AND date = CURRENT_DATE",
              [userId]
            );
            achieved = result[0].total >= badge.condition_value;
          } else if (badge.category === "water") {
            const [result] = await db.query(
              "SELECT COALESCE(SUM(water_intake), 0) as total FROM metrics WHERE user_id = ? AND date = CURRENT_DATE",
              [userId]
            );
            achieved = result[0].total >= badge.condition_value;
          }
          break;

        case "weekly":
          if (badge.category === "steps") {
            const today = new Date();
            const endDate = formatDateISO(today);
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - 6);
            const startDate = formatDateISO(weekStart);
            const weeklySteps = await getWorkoutSteps(userId, startDate, endDate);
            achieved = weeklySteps >= badge.condition_value;
          } else if (badge.category === "workouts") {
            const [result] = await db.query(
              "SELECT COUNT(*) as count FROM workouts WHERE user_id = ? AND created_at >= CURRENT_DATE - INTERVAL '6 days'",
              [userId]
            );
            achieved = result[0].count >= badge.condition_value;
          } else if (badge.category === "calories") {
            const [result] = await db.query(
              "SELECT COALESCE(SUM(calories), 0) as total FROM metrics WHERE user_id = ? AND date >= CURRENT_DATE - INTERVAL '6 days'",
              [userId]
            );
            achieved = result[0].total >= badge.condition_value;
          }
          break;

        case "monthly":
          if (badge.category === "workouts") {
            const [result] = await db.query(
              "SELECT COUNT(*) as count FROM workouts WHERE user_id = ? AND created_at >= CURRENT_DATE - INTERVAL '29 days'",
              [userId]
            );
            achieved = result[0].count >= badge.condition_value;
          }
          break;

        case "streak":
          if (badge.category === "workouts") {
            achieved = await checkWorkoutStreak(userId, badge.condition_value);
          } else if (badge.category === "water") {
            achieved = await checkWaterStreak(userId, badge.condition_value);
          }
          break;
      }

      if (achieved) {
        await db.query(
          "INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)",
          [userId, badge.id]
        );
        newBadges.push(badge);
      }
    }

    return newBadges;
  } catch (error) {
    console.error("Check and award badges error:", error);
    return [];
  }
};

async function checkWorkoutStreak(userId, requiredStreak) {
  try {
    const [workouts] = await db.query(
      `SELECT DISTINCT DATE(created_at) as workout_date
       FROM workouts
       WHERE user_id = ? AND created_at >= CURRENT_DATE - INTERVAL '59 days'
       ORDER BY workout_date DESC`,
      [userId]
    );

    if (workouts.length < requiredStreak) return false;

    let streak = 1;
    for (let i = 1; i < workouts.length; i++) {
      const prevDate = new Date(workouts[i - 1].workout_date);
      const currDate = new Date(workouts[i].workout_date);
      const diffTime = prevDate - currDate;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        streak++;
        if (streak >= requiredStreak) return true;
      } else {
        streak = 1;
      }
    }

    return false;
  } catch (error) {
    console.error("Check workout streak error:", error);
    return false;
  }
}

async function checkWaterStreak(userId, requiredStreak) {
  try {
    const [waterDays] = await db.query(
      `SELECT DISTINCT date
       FROM metrics
       WHERE user_id = ? AND water_intake >= 2000 AND date >= CURRENT_DATE - INTERVAL '59 days'
       ORDER BY date DESC`,
      [userId]
    );

    if (waterDays.length < requiredStreak) return false;

    let streak = 1;
    for (let i = 1; i < waterDays.length; i++) {
      const prevDate = new Date(waterDays[i - 1].date);
      const currDate = new Date(waterDays[i].date);
      const diffTime = prevDate - currDate;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        streak++;
        if (streak >= requiredStreak) return true;
      } else {
        streak = 1;
      }
    }

    return false;
  } catch (error) {
    console.error("Check water streak error:", error);
    return false;
  }
}