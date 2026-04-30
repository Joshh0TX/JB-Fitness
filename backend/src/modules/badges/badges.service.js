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

const getWorkoutSteps = async (userId, startDate = null, endDate = null) => {
  const workouts = await prisma.workouts.findMany({
    where: {
      user_id: userId,
      ...(startDate && endDate && {
        created_at: { gte: new Date(startDate), lte: new Date(endDate + "T23:59:59.999Z") },
      }),
    },
    select: { title: true, duration: true },
  });
  return workouts.reduce((sum, w) => sum + inferStepsFromWorkout(w), 0);
};

const checkWorkoutStreak = async (userId, requiredStreak) => {
  const workouts = await prisma.workouts.findMany({
    where: {
      user_id: userId,
      created_at: { gte: new Date(Date.now() - 59 * 24 * 60 * 60 * 1000) },
    },
    select: { created_at: true },
    orderBy: { created_at: "desc" },
  });

  const uniqueDays = [...new Set(workouts.map((w) => w.created_at.toISOString().slice(0, 10)))];
  if (uniqueDays.length < requiredStreak) return false;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const diff = (new Date(uniqueDays[i - 1]) - new Date(uniqueDays[i])) / 86400000;
    if (diff === 1) {
      streak++;
      if (streak >= requiredStreak) return true;
    } else {
      streak = 1;
    }
  }
  return false;
};

const checkWaterStreak = async (userId, requiredStreak) => {
  const waterDays = await prisma.metrics.findMany({
    where: {
      user_id: userId,
      water_intake: { gte: 2000 },
      date: { gte: new Date(Date.now() - 59 * 24 * 60 * 60 * 1000) },
    },
    select: { date: true },
    orderBy: { date: "desc" },
  });

  const uniqueDays = [...new Set(waterDays.map((m) => m.date.toISOString().slice(0, 10)))];
  if (uniqueDays.length < requiredStreak) return false;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const diff = (new Date(uniqueDays[i - 1]) - new Date(uniqueDays[i])) / 86400000;
    if (diff === 1) {
      streak++;
      if (streak >= requiredStreak) return true;
    } else {
      streak = 1;
    }
  }
  return false;
};

export const getUserBadgesService = async (userId) => {
  return prisma.user_badges.findMany({
    where: { user_id: userId },
    include: { badges: true },
    orderBy: { earned_at: "desc" },
  });
};

export const checkAndAwardBadgesService = async (userId) => {
  try {
    const earnedIds = await prisma.user_badges.findMany({
      where: { user_id: userId },
      select: { badge_id: true },
    });

    const earnedIdSet = earnedIds.map((b) => b.badge_id);

    const availableBadges = await prisma.badges.findMany({
      where: { id: { notIn: earnedIdSet.length ? earnedIdSet : [-1] } },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);
    const todayStr = today.toISOString().slice(0, 10);

    const newBadges = [];

    for (const badge of availableBadges) {
      let achieved = false;

      switch (badge.condition_type) {
        case "total":
          if (badge.category === "steps") {
            achieved = (await getWorkoutSteps(userId)) >= badge.condition_value;
          } else if (badge.category === "workouts") {
            achieved = (await prisma.workouts.count({ where: { user_id: userId } })) >= badge.condition_value;
          }
          break;

        case "daily":
          if (badge.category === "steps") {
            achieved = (await getWorkoutSteps(userId, todayStr, todayStr)) >= badge.condition_value;
          } else if (badge.category === "workouts") {
            achieved = (await prisma.workouts.count({ where: { user_id: userId, created_at: { gte: today, lt: tomorrow } } })) >= badge.condition_value;
          } else if (badge.category === "calories") {
            const agg = await prisma.metrics.aggregate({ where: { user_id: userId, date: { gte: today, lt: tomorrow } }, _sum: { calories: true } });
            achieved = (agg._sum.calories || 0) >= badge.condition_value;
          } else if (badge.category === "water") {
            const agg = await prisma.metrics.aggregate({ where: { user_id: userId, date: { gte: today, lt: tomorrow } }, _sum: { water_intake: true } });
            achieved = (agg._sum.water_intake || 0) >= badge.condition_value;
          }
          break;

        case "weekly":
          if (badge.category === "steps") {
            achieved = (await getWorkoutSteps(userId, sevenDaysAgo.toISOString().slice(0, 10), todayStr)) >= badge.condition_value;
          } else if (badge.category === "workouts") {
            achieved = (await prisma.workouts.count({ where: { user_id: userId, created_at: { gte: sevenDaysAgo } } })) >= badge.condition_value;
          } else if (badge.category === "calories") {
            const agg = await prisma.metrics.aggregate({ where: { user_id: userId, date: { gte: sevenDaysAgo } }, _sum: { calories: true } });
            achieved = (agg._sum.calories || 0) >= badge.condition_value;
          }
          break;

        case "monthly":
          if (badge.category === "workouts") {
            achieved = (await prisma.workouts.count({ where: { user_id: userId, created_at: { gte: thirtyDaysAgo } } })) >= badge.condition_value;
          }
          break;

        case "streak":
          if (badge.category === "workouts") achieved = await checkWorkoutStreak(userId, badge.condition_value);
          else if (badge.category === "water") achieved = await checkWaterStreak(userId, badge.condition_value);
          break;
      }

      if (achieved) {
        await prisma.user_badges.create({ data: { user_id: userId, badge_id: badge.id } });
        newBadges.push(badge);
      }
    }

    return newBadges;
  } catch (err) {
    console.error("Check and award badges error:", err);
    return [];
  }
};