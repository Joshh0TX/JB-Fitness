import {
  getWorkoutsService,
  createWorkoutService,
  updateWorkoutService,
  deleteWorkoutService,
  getWeeklyWorkoutSummaryService,
  getTodayWalkingActivityService,
} from "./workouts.service.js";

export const getWorkouts = async (req, res) => {
  try {
    const workouts = await getWorkoutsService(req.user.id);
    return res.json(workouts);
  } catch (err) {
    console.error("Get workouts error:", err);
    return res.status(500).json({ message: "Failed to fetch workouts" });
  }
};

export const createWorkout = async (req, res) => {
  const { title, duration, calories_burned } = req.body;
  if (!title || duration == null || calories_burned == null) {
    return res.status(400).json({ message: "Missing required workout fields" });
  }
  try {
    const workout = await createWorkoutService(req.user.id, { title, duration, calories_burned });
    return res.status(201).json(workout);
  } catch (err) {
    console.error("Create workout error:", err);
    return res.status(500).json({ message: "Failed to create workout" });
  }
};

export const updateWorkout = async (req, res) => {
  try {
    await updateWorkoutService(req.user.id, Number(req.params.id), req.body);
    return res.json({ message: "Workout updated successfully" });
  } catch (err) {
    console.error("Update workout error:", err);
    return res.status(err.status || 500).json({ message: err.message || "Failed to update workout" });
  }
};

export const deleteWorkout = async (req, res) => {
  try {
    await deleteWorkoutService(req.user.id, Number(req.params.id));
    return res.json({ message: "Workout deleted successfully" });
  } catch (err) {
    console.error("Delete workout error:", err);
    return res.status(err.status || 500).json({ message: err.message || "Failed to delete workout" });
  }
};

export const getWeeklyWorkoutSummary = async (req, res) => {
  try {
    const summary = await getWeeklyWorkoutSummaryService(req.user.id);
    return res.json(summary);
  } catch (err) {
    console.error("Weekly workout summary error:", err);
    return res.status(500).json({ message: "Failed to fetch workout summary" });
  }
};

export const getTodayWalkingActivity = async (req, res) => {
  try {
    const activity = await getTodayWalkingActivityService(req.user.id);
    return res.json(activity);
  } catch (err) {
    console.error("Walking activity error:", err);
    return res.status(500).json({ message: "Failed to fetch walking activity" });
  }
};