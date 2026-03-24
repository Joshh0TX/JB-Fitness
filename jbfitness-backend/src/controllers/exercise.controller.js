import axios from "axios";

const EXERCISE_API = "https://api.api-ninjas.com/v1/exercises";

// Comprehensive mock database of exercises
const mockExercisesDB = {
  "sit-ups": [{ name: "Sit Ups", type: "Strength", muscle: "Abdominals", equipment: "Bodyweight", difficulty: "Intermediate", instructions: "Lie on your back with knees bent. Pull your torso up towards your knees, contracting your abs." }],
  "sit ups": [{ name: "Sit Ups", type: "Strength", muscle: "Abdominals", equipment: "Bodyweight", difficulty: "Intermediate", instructions: "Lie on your back with knees bent. Pull your torso up towards your knees, contracting your abs." }],
  "push-ups": [{ name: "Push Ups", type: "Strength", muscle: "Chest", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Start in plank position. Lower your body until chest is near the floor, then push back up." }],
  "push ups": [{ name: "Push Ups", type: "Strength", muscle: "Chest", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Start in plank position. Lower your body until chest is near the floor, then push back up." }],
  "squats": [{ name: "Squats", type: "Strength", muscle: "Quads", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Stand with feet shoulder-width apart. Lower your body by bending knees and hips." }],
  "squat": [{ name: "Squats", type: "Strength", muscle: "Quads", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Stand with feet shoulder-width apart. Lower your body by bending knees and hips." }],
  "running": [{ name: "Running", type: "Cardio", muscle: "Full Body", equipment: "None", difficulty: "Intermediate", instructions: "Run at a steady or fast pace. Keep your posture upright and breathe steadily." }],
  "burpees": [{ name: "Burpees", type: "Cardio", muscle: "Full Body", equipment: "Bodyweight", difficulty: "Advanced", instructions: "Start standing, drop to plank, do a push up, jump feet to hands, jump up explosively." }],
  "burpee": [{ name: "Burpees", type: "Cardio", muscle: "Full Body", equipment: "Bodyweight", difficulty: "Advanced", instructions: "Start standing, drop to plank, do a push up, jump feet to hands, jump up explosively." }],
  "pull-ups": [{ name: "Pull Ups", type: "Strength", muscle: "Lats", equipment: "Bar", difficulty: "Advanced", instructions: "Hang from a bar and pull your body up until chin is above the bar." }],
  "pull ups": [{ name: "Pull Ups", type: "Strength", muscle: "Lats", equipment: "Bar", difficulty: "Advanced", instructions: "Hang from a bar and pull your body up until chin is above the bar." }],
  "dips": [{ name: "Dips", type: "Strength", muscle: "Triceps", equipment: "Parallel Bars", difficulty: "Intermediate", instructions: "Support yourself on parallel bars and lower your body until elbows are at 90 degrees." }],
  "dip": [{ name: "Dips", type: "Strength", muscle: "Triceps", equipment: "Parallel Bars", difficulty: "Intermediate", instructions: "Support yourself on parallel bars and lower your body until elbows are at 90 degrees." }],
  "lunges": [{ name: "Lunges", type: "Strength", muscle: "Quads", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Step forward and lower your body until back knee nearly touches the ground." }],
  "lunge": [{ name: "Lunges", type: "Strength", muscle: "Quads", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Step forward and lower your body until back knee nearly touches the ground." }],
  "deadlifts": [{ name: "Deadlifts", type: "Strength", muscle: "Back", equipment: "Barbell", difficulty: "Advanced", instructions: "Lift a barbell from the ground to hip level by extending hips and knees." }],
  "deadlift": [{ name: "Deadlifts", type: "Strength", muscle: "Back", equipment: "Barbell", difficulty: "Advanced", instructions: "Lift a barbell from the ground to hip level by extending hips and knees." }],
  "planks": [{ name: "Planks", type: "Strength", muscle: "Core", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Hold a push up position with forearms on the ground. Keep your body in a straight line." }],
  "plank": [{ name: "Planks", type: "Strength", muscle: "Core", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Hold a push up position with forearms on the ground. Keep your body in a straight line." }],
  "crunches": [{ name: "Crunches", type: "Strength", muscle: "Abdominals", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Lie on back with knees bent. Lift shoulders off ground using abdominal muscles." }],
  "crunch": [{ name: "Crunches", type: "Strength", muscle: "Abdominals", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Lie on back with knees bent. Lift shoulders off ground using abdominal muscles." }],
  "leg raises": [{ name: "Leg Raises", type: "Strength", muscle: "Abdominals", equipment: "Bodyweight", difficulty: "Intermediate", instructions: "Lie on back and raise legs to 90 degrees without touching the ground." }],
  "leg raise": [{ name: "Leg Raises", type: "Strength", muscle: "Abdominals", equipment: "Bodyweight", difficulty: "Intermediate", instructions: "Lie on back and raise legs to 90 degrees without touching the ground." }],
  "jumping jacks": [{ name: "Jumping Jacks", type: "Cardio", muscle: "Full Body", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Jump while spreading legs and raising arms overhead, then return to start." }],
  "jumping jack": [{ name: "Jumping Jacks", type: "Cardio", muscle: "Full Body", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Jump while spreading legs and raising arms overhead, then return to start." }],
  "bench press": [{ name: "Bench Press", type: "Strength", muscle: "Chest", equipment: "Barbell", difficulty: "Intermediate", instructions: "Lie on flat bench and press a barbell from chest level upward." }],
  "shoulder press": [{ name: "Shoulder Press", type: "Strength", muscle: "Shoulders", equipment: "Dumbbell", difficulty: "Intermediate", instructions: "Stand and press dumbbells from shoulder height overhead." }],
  "bicep curls": [{ name: "Bicep Curls", type: "Strength", muscle: "Biceps", equipment: "Dumbbell", difficulty: "Beginner", instructions: "Hold dumbbells at sides and curl them up to shoulder height." }],
  "bicep curl": [{ name: "Bicep Curls", type: "Strength", muscle: "Biceps", equipment: "Dumbbell", difficulty: "Beginner", instructions: "Hold dumbbells at sides and curl them up to shoulder height." }],
};

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

    const lowerQuery = query.toLowerCase().trim();

    // First, check the mock database for a match
    for (const [key, exercises] of Object.entries(mockExercisesDB)) {
      if (lowerQuery === key || key.includes(lowerQuery) || lowerQuery.includes(key)) {
        return res.status(200).json({ message: "Found exercises", results: exercises });
      }
    }

    // If no exact match in mock DB, try fuzzy matching
    for (const [key, exercises] of Object.entries(mockExercisesDB)) {
      if (key.includes(lowerQuery) || lowerQuery.includes(key.split("-")[0])) {
        return res.status(200).json({ message: "Found exercises", results: exercises });
      }
    }

    // Try external API as fallback (optional)
    try {
      const response = await axios.get(EXERCISE_API, {
        params: {
          name: lowerQuery,
        },
        headers: {
          "X-Api-Key": process.env.EXERCISE_API_KEY || "",
        },
        timeout: 3000,
      });

      const exercises = response.data || [];

      if (exercises.length > 0) {
        const cleaned = exercises.slice(0, 10).map((ex) => ({
          name: ex.name || "Unknown Exercise",
          type: ex.type || "Strength",
          muscle: ex.muscle || "General",
          equipment: ex.equipment || "None",
          difficulty: ex.difficulty || "Beginner",
          instructions: ex.instructions || "",
        }));

        return res.status(200).json({ message: "Found exercises", results: cleaned });
      }
    } catch (apiError) {
      console.warn("External API failed, trying mock data fallback");
    }

    // If still no match, return a generic exercise based on the query
    return res.status(200).json({
      message: "Exercise not found in database, here's a generic match",
      results: [
        {
          name: query.charAt(0).toUpperCase() + query.slice(1),
          type: "Strength",
          muscle: "General",
          equipment: "Bodyweight",
          difficulty: "Moderate",
          instructions: `Perform ${query} as described. Focus on proper form and control your movements.`,
        },
      ],
    });
  } catch (error) {
    console.error("Exercise search error:", error?.message);
    return res.status(500).json({ message: "Search failed", error: error.message });
  }
};

export const calculateWorkoutCalories = async (req, res) => {
  try {
    const { exerciseName, reps = 0, distance = 0, distanceUnit = 'km', userWeight = 70 } = req.body;

    if (!exerciseName) {
      return res.status(400).json({ message: "Exercise name is required" });
    }

    let calories = 0;
    const lowerName = exerciseName.toLowerCase();

    // Check if it's a running or swimming exercise (distance-based)
    const isCardio = lowerName.includes('running') || lowerName.includes('swimming');

    if (isCardio && distance > 0) {
      // For running/swimming: approximately 80 calories per km for average person (70kg)
      // For swimming: approximately 100 calories per km
      const caloriePerKm = lowerName.includes('swimming') ? 100 : 80;
      
      // Convert miles/laps to km if needed
      let distanceInKm = distance;
      if (distanceUnit === 'miles') {
        distanceInKm = distance * 1.60934; // 1 mile = 1.60934 km
      } else if (distanceUnit === 'laps') {
        // Assuming 1 lap in a pool = 0.05 km (50 meters standard pool)
        distanceInKm = distance * 0.05;
      }

      // Calculate based on distance and weight
      calories = Math.round(caloriePerKm * distanceInKm * (userWeight / 70));
    } else if (reps > 0) {
      // Original reps-based calculation
      const exerciseBurnFactors = {
        "running": 0.3,
        "jumping": 0.25,
        "burpee": 0.5,
        "jump rope": 0.2,
        "sprinting": 0.35,
        "push-up": 0.4,
        "pull-up": 0.45,
        "dip": 0.5,
        "bench press": 0.35,
        "shoulder press": 0.35,
        "curl": 0.15,
        "tricep": 0.15,
        "squat": 0.5,
        "deadlift": 0.6,
        "lunge": 0.3,
        "leg press": 0.45,
        "calf raise": 0.1,
        "crunch": 0.1,
        "sit-up": 0.15,
        "plank": 0.08,
        "leg raise": 0.2,
        "kettlebell": 0.4,
        "medicine ball": 0.35,
        "cable": 0.2,
      };

      let factor = 0.2; // default factor
      for (const [keyword, value] of Object.entries(exerciseBurnFactors)) {
        if (lowerName.includes(keyword)) {
          factor = value;
          break;
        }
      }

      calories = Math.round(factor * reps * (userWeight / 70));
    }

    res.status(200).json({
      exerciseName,
      reps: reps || undefined,
      distance: distance || undefined,
      calories: Math.max(calories, 1), // minimum 1 calorie
      message: `Estimated ${Math.max(calories, 1)} calories burned`,
    });
  } catch (error) {
    console.error("Calorie calculation error:", error);
    res.status(500).json({ message: "Failed to calculate calories" });
  }
};
