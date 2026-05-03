import prisma from "../../config/db.js";

const PROTEIN_GOAL = 60;
const CARBS_LIMIT = 250;

const getDateRange = (period) => {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (period === "daily") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { start: today, end: tomorrow };
  }

  if (period === "weekly") {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    return { start: weekStart, end: new Date() };
  }

  if (period === "monthly") {
    const monthStart = new Date(today);
    monthStart.setDate(today.getDate() - 29);
    return { start: monthStart, end: new Date() };
  }

  return { start: today, end: new Date() };
};

const isCleanEatingDay = (meals) => {
  const totalCarbs = meals.reduce((s, m) => s + (Number(m.carbs) || 0), 0);
  const totalProtein = meals.reduce((s, m) => s + (Number(m.protein) || 0), 0);
  return totalCarbs <= CARBS_LIMIT && totalProtein >= PROTEIN_GOAL;
};

const calculateProgress = async (userId, badge) => {
  const { start, end } = getDateRange(badge.period);

  if (badge.category === "steps") {
    const stepLogs = await prisma.step_logs.findMany({
      where: { user_id: userId, date: { gte: start, lte: end } },
    });

    if (badge.name === "Small Small Waka" || badge.name === "Daily Waka Boss" || badge.name === "No Dey Tire") {
      const todayLog = stepLogs[0];
      const current = Number(todayLog?.steps || 0);
      return { current, target: badge.target_value, percentage: Math.min((current / badge.target_value) * 100, 100) };
    }

    if (badge.name === "Area Stepper" || badge.name === "Waka Specialist" || badge.name === "Odogwu Grinder") {
      const current = stepLogs.reduce((s, l) => s + Number(l.steps || 0), 0);
      return { current, target: badge.target_value, percentage: Math.min((current / badge.target_value) * 100, 100) };
    }

    if (badge.name === "Consistent Sharp Guy" || badge.name === "No Excuse Machine") {
      const current = stepLogs.filter(l => Number(l.steps) >= 10000).length;
      return { current, target: badge.target_value, percentage: Math.min((current / badge.target_value) * 100, 100) };
    }

    if (badge.name === "No Break Streak") {
      const sorted = stepLogs
        .filter(l => Number(l.steps) >= 10000)
        .map(l => l.date.toISOString().slice(0, 10))
        .sort();

      let streak = 0;
      let maxStreak = 0;
      for (let i = 0; i < sorted.length; i++) {
        if (i === 0) { streak = 1; continue; }
        const diff = (new Date(sorted[i]) - new Date(sorted[i - 1])) / 86400000;
        streak = diff === 1 ? streak + 1 : 1;
        maxStreak = Math.max(maxStreak, streak);
      }

      const current = Math.max(streak, maxStreak);
      return { current, target: badge.target_value, percentage: Math.min((current / badge.target_value) * 100, 100) };
    }
  }

  if (badge.category === "nutrition") {
    const meals = await prisma.meals.findMany({
      where: { user_id: userId, created_at: { gte: start, lte: end } },
    });

    if (badge.name === "Clean Chop") {
      const achieved = isCleanEatingDay(meals) ? 1 : 0;
      return { current: achieved, target: 1, percentage: achieved * 100 };
    }

    if (badge.name === "Better Chop Life" || badge.name === "Discipline Baba") {
      const mealsByDay = {};
      for (const meal of meals) {
        const day = meal.created_at.toISOString().slice(0, 10);
        if (!mealsByDay[day]) mealsByDay[day] = [];
        mealsByDay[day].push(meal);
      }

      const cleanDays = Object.values(mealsByDay).filter(isCleanEatingDay).length;
      return { current: cleanDays, target: badge.target_value, percentage: Math.min((cleanDays / badge.target_value) * 100, 100) };
    }
  }

  return { current: 0, target: badge.target_value, percentage: 0 };
};

export const getBadgeProgressService = async (userId) => {
  const badges = await prisma.badges.findMany({ orderBy: { id: "asc" } });
  const earnedBadges = await prisma.user_badges.findMany({ where: { user_id: userId } });
  const earnedIds = new Set(earnedBadges.map(b => b.badge_id));

  const result = await Promise.all(badges.map(async (badge) => {
    const progress = await calculateProgress(userId, badge);
    const isEarned = earnedIds.has(badge.id);
    const justEarned = !isEarned && progress.percentage >= 100;

    if (justEarned) {
      await prisma.user_badges.create({ data: { user_id: userId, badge_id: badge.id } });
    }

    return {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      period: badge.period,
      current: progress.current,
      target: progress.target,
      percentage: Math.round(progress.percentage),
      earned: isEarned || justEarned,
      earnedAt: isEarned ? earnedBadges.find(b => b.badge_id === badge.id)?.earned_at : justEarned ? new Date() : null,
    };
  }));

  return {
    daily: result.filter(b => b.period === "daily"),
    weekly: result.filter(b => b.period === "weekly"),
    monthly: result.filter(b => b.period === "monthly"),
  };
};

export const getUserBadgesService = async (userId) => {
  return prisma.user_badges.findMany({
    where: { user_id: userId },
    include: { badges: true },
    orderBy: { earned_at: "desc" },
  });
};