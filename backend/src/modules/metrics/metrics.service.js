import prisma from "../../config/db.js";

export const getMetricsService = async (userId, { startDate, endDate } = {}) => {
  return prisma.metrics.findMany({
    where: {
      user_id: userId,
      ...(startDate && endDate && {
        date: { gte: new Date(startDate), lte: new Date(endDate) },
      }),
    },
    orderBy: { date: "desc" },
  });
};

export const createMetricService = async (userId, { date, calories, water_intake, workouts_completed }) => {
  const day = new Date(date);

  const existing = await prisma.metrics.findFirst({
    where: { user_id: userId, date: day },
  });

  if (existing) {
    throw { status: 409, message: "Metrics already exist for this date" };
  }

  return prisma.metrics.create({
    data: {
      user_id: userId,
      date: day,
      calories: calories || 0,
      water_intake: water_intake || 0,
      workouts_completed: workouts_completed || 0,
    },
  });
};

export const updateMetricService = async (userId, metricId, { calories, water_intake, workouts_completed }) => {
  const metric = await prisma.metrics.findFirst({ where: { id: metricId, user_id: userId } });
  if (!metric) throw { status: 404, message: "Metric not found" };

  return prisma.metrics.update({
    where: { id: metricId },
    data: { calories, water_intake, workouts_completed },
  });
};

export const deleteMetricService = async (userId, metricId) => {
  const metric = await prisma.metrics.findFirst({ where: { id: metricId, user_id: userId } });
  if (!metric) throw { status: 404, message: "Metric not found" };

  return prisma.metrics.delete({ where: { id: metricId } });
};

export const incrementWaterService = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existing = await prisma.metrics.findFirst({
    where: { user_id: userId, date: { gte: today, lt: tomorrow } },
  });

  if (existing) {
    const updated = await prisma.metrics.update({
      where: { id: existing.id },
      data: { water_intake: { increment: 1 } },
    });
    return { water: updated.water_intake };
  }

  const created = await prisma.metrics.create({
    data: { user_id: userId, date: today, calories: 0, water_intake: 1, workouts_completed: 0 },
  });

  return { water: created.water_intake };
};