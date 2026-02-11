// app.js (ESM version)

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import routes
import authRoutes from "./routes/auth.routes.js";
import workoutRoutes from "./routes/workout.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import metricsRoutes from "./routes/metrics.routes.js";
import userRoutes from "./routes/userRoutes.js";
import mealsRoutes from "./routes/meals.routes.js";
import userProfileRoutes from "./routes/user.profile.routes.js";
import nutritionRoutes from "./routes/nutrition.routes.js";
import exerciseRoutes from "./routes/exercise.routes.js";

// Import DB (just to confirm connection at startup)
import db from "./config/db.js";

// Load correct .env file based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

const app = express();

/* Middleware */
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS, // <-- your Vercel frontend URL
  credentials: true
}));
app.use(express.json()); // parse JSON bodies

/* Optional: check DB connection on startup */
db.getConnection()
  .then(conn => {
    console.log("✅ MySQL pool connected");
    conn.release();
  })
  .catch(err => {
    console.error("❌ MySQL connection failed:", err);
  });

/* Routes */
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/meals", mealsRoutes);
app.use("/api/users", userProfileRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/exercises", exerciseRoutes);

/* Health check route */
app.get("/", (req, res) => {
  res.json({ message: "JBFitness API is running" });
});

app.get("/test", (req, res) => {
  res.send("Backend is working");
});


/* Global error handler (optional but recommended) */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ msg: "Server error" });
});

export default app;