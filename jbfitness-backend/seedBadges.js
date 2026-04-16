import db from "./src/config/db.js";

const badges = [
  // Steps badges
  { name: "First Steps", description: "Walk your first 1,000 steps", icon: "👟", category: "steps", condition_type: "total", condition_value: 1000, condition_unit: "steps", points: 10, rarity: "common" },
  { name: "Daily Walker", description: "Walk 5,000 steps in a day", icon: "🚶", category: "steps", condition_type: "daily", condition_value: 5000, condition_unit: "steps", points: 25, rarity: "common" },
  { name: "Step Master", description: "Walk 10,000 steps in a day", icon: "🏃", category: "steps", condition_type: "daily", condition_value: 10000, condition_unit: "steps", points: 50, rarity: "rare" },
  { name: "Century Club", description: "Walk 100,000 steps in a week", icon: "💯", category: "steps", condition_type: "weekly", condition_value: 100000, condition_unit: "steps", points: 100, rarity: "epic" },
  { name: "Marathon Walker", description: "Walk 200,000 steps in a week", icon: "🏁", category: "steps", condition_type: "weekly", condition_value: 200000, condition_unit: "steps", points: 200, rarity: "legendary" },

  // Workout badges
  { name: "Getting Started", description: "Complete your first workout", icon: "💪", category: "workouts", condition_type: "total", condition_value: 1, condition_unit: "workouts", points: 15, rarity: "common" },
  { name: "Weekly Warrior", description: "Complete 7 workouts in a week", icon: "⚔️", category: "workouts", condition_type: "weekly", condition_value: 7, condition_unit: "workouts", points: 75, rarity: "rare" },
  { name: "Monthly Champion", description: "Complete 30 workouts in a month", icon: "👑", category: "workouts", condition_type: "monthly", condition_value: 30, condition_unit: "workouts", points: 150, rarity: "epic" },
  { name: "Consistency King", description: "Complete workouts for 30 consecutive days", icon: "🔥", category: "workouts", condition_type: "streak", condition_value: 30, condition_unit: "days", points: 300, rarity: "legendary" },

  // Calories badges
  { name: "Calorie Conscious", description: "Burn 500 calories in a day", icon: "🔥", category: "calories", condition_type: "daily", condition_value: 500, condition_unit: "calories", points: 20, rarity: "common" },
  { name: "Calorie Crusher", description: "Burn 1,000 calories in a day", icon: "💥", category: "calories", condition_type: "daily", condition_value: 1000, condition_unit: "calories", points: 40, rarity: "rare" },
  { name: "Weekly Burner", description: "Burn 5,000 calories in a week", icon: "🌟", category: "calories", condition_type: "weekly", condition_value: 5000, condition_unit: "calories", points: 100, rarity: "epic" },

  // Water intake badges
  { name: "Hydration Hero", description: "Drink 2 liters of water in a day", icon: "💧", category: "water", condition_type: "daily", condition_value: 2000, condition_unit: "ml", points: 15, rarity: "common" },
  { name: "Water Warrior", description: "Drink 3 liters of water in a day", icon: "🌊", category: "water", condition_type: "daily", condition_value: 3000, condition_unit: "ml", points: 30, rarity: "rare" },
  { name: "Hydration Champion", description: "Drink 2 liters of water for 7 consecutive days", icon: "🏆", category: "water", condition_type: "streak", condition_value: 7, condition_unit: "days", points: 100, rarity: "epic" },

  // Special achievement badges
  { name: "Early Bird", description: "Complete a workout before 7 AM", icon: "🌅", category: "workouts", condition_type: "special", condition_value: 1, condition_unit: "early_workouts", points: 25, rarity: "rare" },
  { name: "Night Owl", description: "Complete a workout after 10 PM", icon: "🦉", category: "workouts", condition_type: "special", condition_value: 1, condition_unit: "late_workouts", points: 25, rarity: "rare" },
];

async function seedBadges() {
  try {
    console.log("🌱 Seeding badges...");

    for (const badge of badges) {
      await db.query(
        `INSERT INTO badges (name, description, icon, category, condition_type, condition_value, condition_unit, points, rarity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (name) DO NOTHING`,
        [
          badge.name,
          badge.description,
          badge.icon,
          badge.category,
          badge.condition_type,
          badge.condition_value,
          badge.condition_unit,
          badge.points,
          badge.rarity
        ]
      );
    }

    console.log("✅ Badges seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding badges:", error);
  } finally {
    process.exit(0);
  }
}

seedBadges();