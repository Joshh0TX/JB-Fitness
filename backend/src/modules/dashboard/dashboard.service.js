import prisma from "../../config/db.js";
import { checkAndAwardBadgesService } from "../badges/badges.service.js";

export const getDashboardService = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  // Today's metrics
  const todayMetrics = await prisma.metrics.aggregate({
    where: { user_id: userId, date: { gte: today, lt: tomorrow } },
    _sum: { calories: true, workouts_completed: true, water_intake: true },
  });

  // Weekly calories (last 7 days)
  const weeklyMetrics = await prisma.metrics.findMany({
    where: { user_id: userId, date: { gte: sevenDaysAgo, lt: tomorrow } },
    select: { date: true, calories: true },
    orderBy: { date: "asc" },
  });

  // Build 7-day array filling missing days with 0
  const weeklyProgress = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dayString = day.toISOString().slice(0, 10);
    const found = weeklyMetrics.find((r) => r.date.toISOString().slice(0, 10) === dayString);
    weeklyProgress.push(found?.calories || 0);
  }

  const newBadges = await checkAndAwardBadgesService(userId);

  return {
    calories: todayMetrics._sum.calories || 0,
    workouts: todayMetrics._sum.workouts_completed || 0,
    water: todayMetrics._sum.water_intake || 0,
    weeklyProgress,
    newBadges,
  };
};

export const getDashboardSummaryService = async (userId) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // Last 7 days metrics
  const metrics = await prisma.metrics.findMany({
    where: { user_id: userId },
    orderBy: { date: "desc" },
    take: 7,
  });

  // Last 7 days workout totals
  const workoutAgg = await prisma.workouts.aggregate({
    where: { user_id: userId, created_at: { gte: sevenDaysAgo } },
    _count: true,
    _sum: { calories_burned: true },
  });

  return {
    metrics,
    workouts: {
      total_workouts: workoutAgg._count || 0,
      total_calories: workoutAgg._sum.calories_burned || 0,
    },
  };
};