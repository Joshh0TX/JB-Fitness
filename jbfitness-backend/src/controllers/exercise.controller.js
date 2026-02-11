import axios from "axios";

const EXERCISE_API = "https://api.api-ninjas.com/v1/exercises";

// Calculate calories burned based on exercise type and reps
function calculateCaloriesBurned(exerciseName, reps, userWeight = 70) {
  // Calorie burn factors per rep for different exercise categories
  const exerciseBurnFactors = {
    // Cardio exercises (high burn rate)
    "running": 0.3,
    "jumping": 0.25,
    "burpee": 0.5,
    "jump rope": 0.2,
    "sprinting": 0.35,
    
    // Upper body strength
    "push-up": 0.4,
    "pull-up": 0.45,
    "dip": 0.5,
    "bench press": 0.35,
    "shoulder press": 0.35,
    "curl": 0.15,
    "tricep": 0.15,
    
    // Lower body strength
    "squat": 0.5,
    "deadlift": 0.6,
    "lunge": 0.3,
    "leg press": 0.45,
    "calf raise": 0.1,
    
    // Core exercises
    "crunch": 0.1,
    "sit-up": 0.15,
    "plank": 0.08,
    "leg raise": 0.2,
    
    // Full body / compound
    "kettlebell": 0.4,
    "medicine ball": 0.35,
    "cable": 0.2,
  };

  const lowerName = exerciseName.toLowerCase();
  
  // Find matching factor
  let factor = 0.2; // default factor
  for (const [keyword, value] of Object.entries(exerciseBurnFactors)) {
    if (lowerName.includes(keyword)) {
      factor = value;
      break;
    }
  }

  // Calculate calories: factor × reps × (weight / 70kg baseline)
  const caloriesBurned = Math.round(factor * reps * (userWeight / 70));
  return Math.max(caloriesBurned, 1); // minimum 1 calorie
}

export const searchExercises = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Using api-ninjas exercises endpoint
    const response = await axios.get(EXERCISE_API, {
      params: {
        name: query.trim(),
      },
      headers: {
        "X-Api-Key": process.env.EXERCISE_API_KEY || "", // Optional API key if available
      },
      timeout: 5000,
    });

    const exercises = response.data || [];

    if (exercises.length === 0) {
      return res.status(404).json({ message: "No exercises found", results: [] });
    }

    // Clean and format the results
    const cleaned = exercises.slice(0, 10).map((ex) => ({
      name: ex.name || "Unknown Exercise",
      type: ex.type || "Strength",
      muscle: ex.muscle || "General",
      equipment: ex.equipment || "None",
      difficulty: ex.difficulty || "Beginner",
      instructions: ex.instructions || "",
    }));

    res.status(200).json({ message: "Found exercises", results: cleaned });
  } catch (error) {
    console.error("Exercise search error:", error?.message);
    
    // If API fails, return mock data as fallback
    const mockExercises = {
      "sit ups": [
        { name: "Sit Ups", type: "Strength", muscle: "Abdominals", equipment: "Bodyweight", difficulty: "Intermediate", instructions: "Lie down and perform sit ups" }
      ],
      "push up": [
        { name: "Push Ups", type: "Strength", muscle: "Chest", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Push your body up from the ground" }
      ],
      "squat": [
        { name: "Bodyweight Squats", type: "Strength", muscle: "Quads", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Lower your body by bending knees" }
      ],
      "running": [
        { name: "Running", type: "Cardio", muscle: "Full Body", equipment: "None", difficulty: "Intermediate", instructions: "Run at a steady pace" }
      ],
      "burpee": [
        { name: "Burpees", type: "Cardio", muscle: "Full Body", equipment: "Bodyweight", difficulty: "Advanced", instructions: "Combine push up and jump movements" }
      ]
    };

    const lowerQuery = query.toLowerCase();
    let results = [];
    
    for (const [key, value] of Object.entries(mockExercises)) {
      if (lowerQuery.includes(key) || key.includes(lowerQuery)) {
        results = value;
        break;
      }
    }

    if (results.length === 0) {
      // If no match, return a generic exercise
      results = [
        { name: query, type: "Strength", muscle: "General", equipment: "None", difficulty: "Moderate", instructions: "Perform the exercise as described" }
      ];
    }

    res.status(200).json({ message: "Found exercises (fallback)", results });
  }
};

export const calculateWorkoutCalories = async (req, res) => {
  try {
    const { exerciseName, reps, userWeight = 70 } = req.body;

    if (!exerciseName) {
      return res.status(400).json({ message: "Exercise name is required" });
    }

    const calories = calculateCaloriesBurned(exerciseName, reps, userWeight);

    res.status(200).json({
      exerciseName,
      reps,
      calories,
      message: `Estimated ${calories} calories burned`,
    });
  } catch (error) {
    console.error("Calorie calculation error:", error);
    res.status(500).json({ message: "Failed to calculate calories" });
  }
};
