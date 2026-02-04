// app.js (ESM version)

// Import dependencies and routes
import authRoutes from "./routes/auth.routes.js";
import express from "express";
import cors from "cors";
import db from "./config/db.js";   // assuming db.js exports something
import workoutRoutes from "./routes/workout.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import metricsRoutes from "./routes/metrics.routes.js";
import userRoutes from "./routes/userRoutes.js";
import mealsRoutes from "./routes/meals.routes.js";
import userProfileRoutes from "./routes/user.profile.routes.js"
const app = express();

/* Middleware */
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/meals", mealsRoutes);
app.use("/api/users", userProfileRoutes);

/* Health check route */
app.get("/", (req, res) => {
  res.json({ message: "JBFitness API is running" });
});

// Export the app for server.js
export default app;