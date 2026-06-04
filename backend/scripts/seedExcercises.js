import "dotenv/config";
import prisma from "../src/config/db.js";

const API_KEY = "2ZLhhctA1ph2JSFPdaRhvJKexr3BOU14XdIi3Lw6";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const muscles = [
  "abdominals", "abductors", "adductors", "biceps", "calves",
  "chest", "forearms", "glutes", "hamstrings", "lats",
  "lower_back", "middle_back", "neck", "quadriceps",
  "shoulders", "traps", "triceps"
];

const seedExercises = async () => {
  let total = 0;
  for (const muscle of muscles) {
    try {
      const res = await fetch(
        `https://api.api-ninjas.com/v1/exercises?muscle=${muscle}&limit=20`,
        { headers: { "X-Api-Key": API_KEY } }
      );
      const exercises = await res.json();
      for (const ex of exercises) {
        await prisma.exercise.upsert({
          where: { name: ex.name },
          update: {},
          create: {
            name: ex.name,
            type: ex.type || "strength",
            muscle: ex.muscle || muscle,
            difficulty: ex.difficulty || "intermediate",
            instructions: ex.instructions || null,
            equipment: Array.isArray(ex.equipments) ? ex.equipments.join(", ") : ex.equipment || null,
          },
        });
      }
      total += exercises.length;
      console.log(` ${muscle}: ${exercises.length} exercises seeded`);
      await sleep(500);
    } catch (err) {
      console.error(` Failed for ${muscle}:`, err.message);
    }
  }
  console.log(`\n🎉 Done! Total exercises seeded: ${total}`);
  await prisma.$disconnect();
};

seedExercises();