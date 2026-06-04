import prisma from "../../config/db.js";

export const searchExercisesService = async (query) => {
  return prisma.exercise.findMany({
    where: {
      name: { contains: query, mode: "insensitive" },
    },
    take: 10,
  });
};