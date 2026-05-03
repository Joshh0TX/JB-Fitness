import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const badges = [
  // Daily
  {
    name: "Small Small Waka",
    description: "Walk 5,000 steps in a day — every journey starts small!",
    icon: "🥾",
    category: "steps",
    period: "daily",
    target_value: 5000,
    target_unit: "steps",
  },
  {
    name: "Daily Waka Boss",
    description: "Hit 10,000 steps in a day — you don dey try!",
    icon: "🚶",
    category: "steps",
    period: "daily",
    target_value: 10000,
    target_unit: "steps",
  },
  {
    name: "No Dey Tire",
    description: "Crush 15,000+ steps in a day — you no get tiredness!",
    icon: "🏃",
    category: "steps",
    period: "daily",
    target_value: 15000,
    target_unit: "steps",
  },
  {
    name: "Clean Chop",
    description: "Keep carbs ≤ 250g AND hit protein goal in a day — discipline dey!",
    icon: "🥗",
    category: "nutrition",
    period: "daily",
    target_value: 1,
    target_unit: "day",
  },
  // Weekly
  {
    name: "Consistent Sharp Guy",
    description: "Hit 10,000 steps on 5 different days this week!",
    icon: "⚡",
    category: "steps",
    period: "weekly",
    target_value: 5,
    target_unit: "days",
  },
  {
    name: "Area Stepper",
    description: "Walk 70,000 steps in a week — you don cover the whole area!",
    icon: "🗺️",
    category: "steps",
    period: "weekly",
    target_value: 70000,
    target_unit: "steps",
  },
  {
    name: "No Break Streak",
    description: "Hit 10,000 steps for 3 consecutive days — no slack!",
    icon: "🔥",
    category: "steps",
    period: "weekly",
    target_value: 3,
    target_unit: "days",
  },
  {
    name: "Better Chop Life",
    description: "Eat clean for 5 days this week — carbs under control, protein on point!",
    icon: "🍱",
    category: "nutrition",
    period: "weekly",
    target_value: 5,
    target_unit: "days",
  },
  // Monthly
  {
    name: "Waka Specialist",
    description: "Walk 120km in a month (~170,000 steps) — you be movement specialist!",
    icon: "🏅",
    category: "steps",
    period: "monthly",
    target_value: 170000,
    target_unit: "steps",
  },
  {
    name: "Odogwu Grinder",
    description: "Smash 250,000+ steps in a month — odogwu level unlocked!",
    icon: "👑",
    category: "steps",
    period: "monthly",
    target_value: 250000,
    target_unit: "steps",
  },
  {
    name: "Discipline Baba",
    description: "Eat clean for 20 days in a month — discipline is your superpower!",
    icon: "💪",
    category: "nutrition",
    period: "monthly",
    target_value: 20,
    target_unit: "days",
  },
  {
    name: "No Excuse Machine",
    description: "Hit 10,000 steps on 25 days this month — no excuse, only results!",
    icon: "🤖",
    category: "steps",
    period: "monthly",
    target_value: 25,
    target_unit: "days",
  },
];

async function main() {
  console.log("Seeding badges...");

  for (const badge of badges) {
    await prisma.badges.upsert({
      where: { id: badges.indexOf(badge) + 1 },
      update: badge,
      create: badge,
    });
  }

  console.log("12 Nigerian badges seeded!");
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());