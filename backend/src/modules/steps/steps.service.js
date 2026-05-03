import prisma from "../../config/db.js";

export const logStepsService = async (userId, { steps, date }) => {
  const day = date ? new Date(date) : new Date();
  day.setHours(0, 0, 0, 0);

  return prisma.step_logs.upsert({
    where: { user_id_date: { user_id: userId, date: day } },
    update: { steps: Number(steps) },
    create: { user_id: userId, steps: Number(steps), date: day },
  });
};

export const getStepsService = async (userId, { startDate, endDate } = {}) => {
  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = endDate ? new Date(endDate) : new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return prisma.step_logs.findMany({
    where: { user_id: userId, date: { gte: start, lte: end } },
    orderBy: { date: "desc" },
  });
};

export const getTodayStepsService = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const log = await prisma.step_logs.findFirst({
    where: { user_id: userId, date: { gte: today, lt: tomorrow } },
  });

  return { steps: log?.steps || 0, date: today };
};