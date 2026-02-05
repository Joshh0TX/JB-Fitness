import axios from "axios";

const DEMO_MODE = String(import.meta.env.VITE_DEMO_MODE).toLowerCase() === "true";

function safeJsonParse(maybeJson, fallback = {}) {
  if (maybeJson == null) return fallback;
  if (typeof maybeJson === "object") return maybeJson;
  try {
    return JSON.parse(maybeJson);
  } catch {
    return fallback;
  }
}

function getStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function last7DaysISO() {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function computeMealSummaries(meals) {
  const today = todayISO();
  const todaysMeals = meals.filter((m) => m.day === today);

  const daily = {
    totalCalories: todaysMeals.reduce((s, m) => s + (Number(m.calories) || 0), 0),
    totalProtein: todaysMeals.reduce((s, m) => s + (Number(m.protein) || 0), 0),
    totalCarbs: todaysMeals.reduce((s, m) => s + (Number(m.carbs) || 0), 0),
    totalFats: todaysMeals.reduce((s, m) => s + (Number(m.fats) || 0), 0),
    mealsCount: todaysMeals.length,
  };

  const weekly = last7DaysISO().map((day) => {
    const dayMeals = meals.filter((m) => m.day === day);
    return {
      day,
      totalCalories: dayMeals.reduce((s, m) => s + (Number(m.calories) || 0), 0),
      totalProtein: dayMeals.reduce((s, m) => s + (Number(m.protein) || 0), 0),
      totalCarbs: dayMeals.reduce((s, m) => s + (Number(m.carbs) || 0), 0),
      totalFats: dayMeals.reduce((s, m) => s + (Number(m.fats) || 0), 0),
    };
  });

  return { daily, weekly };
}

function computeWorkoutWeekly(workouts) {
  const days = last7DaysISO();
  const byDay = new Map(days.map((d) => [d, 0]));
  for (const w of workouts) {
    if (byDay.has(w.day)) byDay.set(w.day, byDay.get(w.day) + 1);
  }
  return days.map((day) => ({ day, totalWorkouts: byDay.get(day) || 0 }));
}

function makeDemoResponse(config, data, status = 200) {
  return Promise.resolve({
    data,
    status,
    statusText: status >= 200 && status < 300 ? "OK" : "ERROR",
    headers: {},
    config,
    request: {},
  });
}

const demoAdapter = async (config) => {
  // Normalize url (axios passes `/path` typically)
  const url = (config.url || "").replace(/^\//, "");
  const method = (config.method || "get").toLowerCase();
  const body = safeJsonParse(config.data, {});

  // Auth
  if (url === "auth/register" && method === "post") {
    // Minimal demo user creation; stores token just like real flow.
    const demoUser = { id: 1, name: body.name || "Demo User", email: body.email || "demo@jbfitness.com" };
    setStore("demo.user", demoUser);
    return makeDemoResponse(config, { token: "demo-token", user: demoUser }, 201);
  }

  if (url === "auth/login" && method === "post") {
    const demoUser = getStore("demo.user", { id: 1, name: "Demo User", email: body.email || "demo@jbfitness.com" });
    setStore("demo.user", demoUser);
    return makeDemoResponse(config, { token: "demo-token", user: demoUser }, 200);
  }

  // Meals
  if (url === "meals/daily-summary" && method === "get") {
    const meals = getStore("demo.meals", []);
    const { daily } = computeMealSummaries(meals);
    return makeDemoResponse(config, daily, 200);
  }

  if (url === "meals/weekly-summary" && method === "get") {
    const meals = getStore("demo.meals", []);
    const { weekly } = computeMealSummaries(meals);
    return makeDemoResponse(config, weekly, 200);
  }

  if (url === "meals" && method === "post") {
    const meals = getStore("demo.meals", []);
    const nextId = meals.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;
    meals.unshift({
      id: nextId,
      name: body.name,
      calories: body.calories,
      protein: body.protein,
      carbs: body.carbs,
      fats: body.fats,
      day: todayISO(),
      created_at: new Date().toISOString(),
    });
    setStore("demo.meals", meals);
    return makeDemoResponse(config, { message: "Meal added successfully", mealId: nextId }, 201);
  }

  if (url === "meals" && method === "get") {
    const meals = getStore("demo.meals", []);
    return makeDemoResponse(config, meals, 200);
  }

  // Workouts
  if (url === "workouts/weekly-summary" && method === "get") {
    const workouts = getStore("demo.workouts", []);
    return makeDemoResponse(config, computeWorkoutWeekly(workouts), 200);
  }

  if (url === "workouts" && method === "post") {
    const workouts = getStore("demo.workouts", []);
    const nextId = workouts.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;
    workouts.unshift({
      id: nextId,
      title: body.title || "Workout",
      duration: body.duration || 30,
      calories_burned: body.calories_burned || 200,
      day: todayISO(),
      created_at: new Date().toISOString(),
    });
    setStore("demo.workouts", workouts);
    return makeDemoResponse(config, { id: nextId }, 201);
  }

  if (url === "workouts" && method === "get") {
    const workouts = getStore("demo.workouts", []);
    return makeDemoResponse(config, workouts, 200);
  }

  // Dashboard
  if (url === "dashboard" && method === "get") {
    const meals = getStore("demo.meals", []);
    const workouts = getStore("demo.workouts", []);

    const { daily, weekly } = computeMealSummaries(meals);
    const workoutWeekly = computeWorkoutWeekly(workouts);

    // mimic backend response shape
    const weeklyProgress = weekly.map((d) => d.totalCalories);
    const todayWorkouts = workoutWeekly.find((d) => d.day === todayISO())?.totalWorkouts || 0;

    return makeDemoResponse(
      config,
      {
        calories: daily.totalCalories,
        workouts: todayWorkouts,
        water: 3,
        weeklyProgress,
      },
      200
    );
  }

  // Default: return empty success for unknown endpoint so UI remains demo-friendly
  return makeDemoResponse(config, {}, 200);
};

const API = axios.create({
  // Prefer env for prod (Vercel), fallback for local dev.
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://jbfitness-backend.onrender.com",
  adapter: DEMO_MODE ? demoAdapter : undefined,
});

// 🔐 Attach token automatically to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
