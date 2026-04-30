import express from "express";
import cors from "cors";
import prisma from "./config/db.js";

import authRoutes from "./modules/auth/auth.routes.js";
import mealsRoutes from "./modules/meals/meals.routes.js";
import workoutRoutes from "./modules/workouts/workouts.routes.js";
import metricsRoutes from "./modules/metrics/metrics.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import badgesRoutes from "./modules/badges/badges.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import faqRoutes from "./modules/faq/faq.routes.js";
import exerciseRoutes from "./modules/exercise/exercise.routes.js";
import paymentRoutes from "./modules/payments/payments.routes.js";
import nutritionRoutes from "./modules/nutrition/nutrition.routes.js";

const app = express();

const parseAllowedOrigins = () =>
  String(process.env.ALLOWED_ORIGINS ?? "").trim().split(",").map((o) => o.trim()).filter(Boolean);

const allowedOrigins = parseAllowedOrigins();

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (!allowedOrigins.length || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS blocked: origin not allowed"));
  },
  credentials: true,
}));

app.use(express.json());

prisma.$connect()
  .then(() => console.log(" Database connected"))
  .catch((err) => console.error(" Database connection failed:", err.message));

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/user", usersRoutes);
app.use("/api/meals", mealsRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/badges", badgesRoutes);
app.use("/api/faq", faqRoutes);

app.get("/", (req, res) => res.json({ message: "JBFitness API is running" }));
app.get("/test", (req, res) => res.send("Backend is working"));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ msg: "Server error" });
});

export default app;