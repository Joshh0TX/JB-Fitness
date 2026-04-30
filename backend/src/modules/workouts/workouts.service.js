import prisma from "../../config/db.js";

const parseDistanceKmFromTitle = (title = "") => {
  const match = String(title).match(/(\d+(?:\.\d+)?)\s*(km|kilometers?|mi|miles?)/i);
  if (!match) return 0;
  const distance = Number(match[1]);
  if (!Number.isFinite(distance) || distance <= 0) return 0;
  return String(match[2]).toLowerCase().startsWith("mi") ? distance * 1.60934 : distance;
};

const parseStepsFromTitle = (title = "") => {
  const match = String(title).match(/(\d{3,6})\s*steps?/i);
  if (!match) return 0;
  const steps = Number(match[1]);
  return Number.isFinite(steps) && steps > 0 ? Math.round(steps) : 0;
};

const isStepEligibleWorkout = (title = "") =>
  /walk|run|jog|hike|treadmill|steps?|cardio|km|kilometer|mile|mi\b/.test(String(title).toLowerCase());

export const getWorkoutsService = async (userId) => {
  return prisma.workouts.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
  });
};

export const createWorkoutService = async (userId, { title, duration, calories_burned }) => {
  const workout = await prisma.workouts.create({
    data: { user_id: userId, title, duration, calories_burned },
  });

  // Upsert today's metrics
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await prisma.metrics.findFirst({
      where: { user_id: userId, date: { gte: today, lt: tomorrow } },
    });

    if (existing) {
      await prisma.metrics.update({
        where: { id: existing.id },
        data: { workouts_completed: { increment: 1 } },
      });
    } else {
      await prisma.metrics.create({
        data: { user_id: userId, date: today, calories: 0, water_intake: 0, workouts_completed: 1 },
      });
    }
  } catch (err) {
    console.error("Failed to update metrics after workout creation:", err);
  }

  return workout;
};

export const updateWorkoutService = async (userId, workoutId, { title, duration, calories_burned }) => {
  const workout = await prisma.workouts.findFirst({ where: { id: workoutId, user_id: userId } });
  if (!workout) throw { status: 404, message: "Workout not found" };

  return prisma.workouts.update({
    where: { id: workoutId },
    data: { title, duration, calories_burned },
  });
};

export const deleteWorkoutService = async (userId, workoutId) => {
  const workout = await prisma.workouts.findFirst({ where: { id: workoutId, user_id: userId } });
  if (!workout) throw { status: 404, message: "Workout not found" };

  return prisma.workouts.delete({ where: { id: workoutId } });
};

export const getWeeklyWorkoutSummaryService = async (userId) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const workouts = await prisma.workouts.findMany({
    where: { user_id: userId, created_at: { gte: sevenDaysAgo } },
    select: { calories_burned: true, created_at: true },
  });

  const result = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const dayString = day.toISOString().split("T")[0];

    const dayWorkouts = workouts.filter(
      (w) => w.created_at.toISOString().slice(0, 10) === dayString
    );

    result.push({
      day: dayString,
      totalWorkouts: dayWorkouts.length,
      totalCalories: dayWorkouts.reduce((s, w) => s + (w.calories_burned || 0), 0),
    });
  }

  return result;
};

export const getTodayWalkingActivityService = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const workouts = await prisma.workouts.findMany({
    where: { user_id: userId, created_at: { gte: today, lt: tomorrow } },
    select: { title: true, duration: true, calories_burned: true },
  });

  const totals = workouts.reduce(
    (acc, workout) => {
      const title = String(workout.title || "");
      if (!isStepEligibleWorkout(title)) return acc;

      const minutes = Number(workout.duration || 0);
      const calories = Number(workout.calories_burned || 0);
      const distanceKm = parseDistanceKmFromTitle(title) || (minutes / 60) * 5;
      const steps = parseStepsFromTitle(title) || (distanceKm > 0 ? Math.round(distanceKm * 1312) : Math.round(minutes * 105));

      acc.minutesWalked += minutes;
      acc.caloriesBurned += calories;
      acc.distanceKm += distanceKm;
      acc.steps += steps;
      return acc;
    },
    { steps: 0, minutesWalked: 0, caloriesBurned: 0, distanceKm: 0 }
  );

  return {
    steps: Math.round(totals.steps),
    caloriesBurned: Math.round(totals.caloriesBurned),
    distanceKm: Number(totals.distanceKm.toFixed(2)),
    minutesWalked: Math.round(totals.minutesWalked),
  };
};