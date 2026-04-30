import axios from "axios";

const EXERCISE_API = "https://api.api-ninjas.com/v1/exercises";

const MOCK_EXERCISES = {
  "sit-ups": [{ name: "Sit Ups", type: "Strength", muscle: "Abdominals", equipment: "Bodyweight", difficulty: "Intermediate", instructions: "Lie on your back with knees bent. Pull your torso up towards your knees." }],
  "push-ups": [{ name: "Push Ups", type: "Strength", muscle: "Chest", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Start in plank position. Lower your body until chest is near the floor, then push back up." }],
  "squats": [{ name: "Squats", type: "Strength", muscle: "Quads", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Stand with feet shoulder-width apart. Lower your body by bending knees and hips." }],
  "running": [{ name: "Running", type: "Cardio", muscle: "Full Body", equipment: "None", difficulty: "Intermediate", instructions: "Run at a steady pace. Keep posture upright and breathe steadily." }],
  "burpees": [{ name: "Burpees", type: "Cardio", muscle: "Full Body", equipment: "Bodyweight", difficulty: "Advanced", instructions: "Drop to plank, do a push up, jump feet to hands, jump up explosively." }],
  "pull-ups": [{ name: "Pull Ups", type: "Strength", muscle: "Lats", equipment: "Bar", difficulty: "Advanced", instructions: "Hang from a bar and pull your body up until chin is above the bar." }],
  "lunges": [{ name: "Lunges", type: "Strength", muscle: "Quads", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Step forward and lower your body until back knee nearly touches the ground." }],
  "deadlifts": [{ name: "Deadlifts", type: "Strength", muscle: "Back", equipment: "Barbell", difficulty: "Advanced", instructions: "Lift a barbell from the ground to hip level by extending hips and knees." }],
  "plank": [{ name: "Planks", type: "Strength", muscle: "Core", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Hold a push up position with forearms on the ground. Keep body in a straight line." }],
  "crunches": [{ name: "Crunches", type: "Strength", muscle: "Abdominals", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Lie on back with knees bent. Lift shoulders off ground using abdominal muscles." }],
  "bench press": [{ name: "Bench Press", type: "Strength", muscle: "Chest", equipment: "Barbell", difficulty: "Intermediate", instructions: "Lie on flat bench and press a barbell from chest level upward." }],
  "bicep curls": [{ name: "Bicep Curls", type: "Strength", muscle: "Biceps", equipment: "Dumbbell", difficulty: "Beginner", instructions: "Hold dumbbells at sides and curl them up to shoulder height." }],
};

const BURN_FACTORS = {
  "running": 0.3, "jumping": 0.25, "burpee": 0.5, "push-up": 0.4,
  "pull-up": 0.45, "dip": 0.5, "bench press": 0.35, "shoulder press": 0.35,
  "curl": 0.15, "squat": 0.5, "deadlift": 0.6, "lunge": 0.3,
  "crunch": 0.1, "sit-up": 0.15, "plank": 0.08, "leg raise": 0.2,
};

export const searchExercisesService = async (query) => {
  const lower = query.toLowerCase().trim();

  // Check mock DB first
  for (const [key, exercises] of Object.entries(MOCK_EXERCISES)) {
    if (lower === key || key.includes(lower) || lower.includes(key)) {
      return exercises;
    }
  }

  // Try external API
  try {
    const response = await axios.get(EXERCISE_API, {
      params: { name: lower },
      headers: { "X-Api-Key": process.env.EXERCISE_API_KEY || "" },
      timeout: 3000,
    });

    if (response.data?.length > 0) {
      return response.data.slice(0, 10).map((ex) => ({
        name: ex.name || "Unknown",
        type: ex.type || "Strength",
        muscle: ex.muscle || "General",
        equipment: ex.equipment || "None",
        difficulty: ex.difficulty || "Beginner",
        instructions: ex.instructions || "",
      }));
    }
  } catch {
    // fall through to generic
  }

  // Generic fallback
  return [{
    name: query.charAt(0).toUpperCase() + query.slice(1),
    type: "Strength", muscle: "General", equipment: "Bodyweight",
    difficulty: "Moderate",
    instructions: `Perform ${query} with proper form and controlled movements.`,
  }];
};

export const calculateCaloriesService = ({ exerciseName, reps = 0, distance = 0, distanceUnit = "km", userWeight = 70 }) => {
  const lower = exerciseName.toLowerCase();
  const isCardio = lower.includes("running") || lower.includes("swimming");

  if (isCardio && distance > 0) {
    const caloriePerKm = lower.includes("swimming") ? 100 : 80;
    let distanceKm = distance;
    if (distanceUnit === "miles") distanceKm = distance * 1.60934;
    else if (distanceUnit === "laps") distanceKm = distance * 0.05;
    return Math.max(Math.round(caloriePerKm * distanceKm * (userWeight / 70)), 1);
  }

  if (reps > 0) {
    let factor = 0.2;
    for (const [keyword, value] of Object.entries(BURN_FACTORS)) {
      if (lower.includes(keyword)) { factor = value; break; }
    }
    return Math.max(Math.round(factor * reps * (userWeight / 70)), 1);
  }

  return 1;
};