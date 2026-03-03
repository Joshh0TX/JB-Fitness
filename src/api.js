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
  const byDay = new Map(days.map((d) => [d, { totalWorkouts: 0, totalCalories: 0 }]));
  for (const w of workouts) {
    const day = w.day || w.created_at?.slice(0, 10);
    if (day && byDay.has(day)) {
      const curr = byDay.get(day);
      curr.totalWorkouts += 1;
      curr.totalCalories += Number(w.calories_burned) || 0;
      byDay.set(day, curr);
    }
  }
  return days.map((day) => ({
    day,
    totalWorkouts: byDay.get(day)?.totalWorkouts || 0,
    totalCalories: byDay.get(day)?.totalCalories || 0,
  }));
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
  const url = (config.url || "").replace(/^\/+/, "");
  const method = (config.method || "get").toLowerCase();
  const body = safeJsonParse(config.data, {});

  // Auth
  if (url === "/api/auth/register" && method === "post") {
    const demoUser = { id: 1, name: body.name || "Demo User", email: body.email || "demo@jbfitness.com" };
    setStore("demo.user", demoUser);
    return makeDemoResponse(config, { token: "demo-token", user: demoUser }, 201);
  }

  if (url === "/api/auth/login" && method === "post") {
    const demoUser = getStore("demo.user", { id: 1, name: "Demo User", email: body.email || "demo@jbfitness.com" });
    setStore("demo.user", demoUser);
    return makeDemoResponse(config, { token: "demo-token", user: demoUser }, 200);
  }

  if ((url.includes("auth/forgot-password") || url.endsWith("forgot-password")) && method === "post") {
    return makeDemoResponse(config, {
      msg: "If an account exists with that email, you will receive password reset instructions shortly.",
    }, 200);
  }

  if ((url.includes("auth/reset-password") || url.endsWith("reset-password")) && method === "post") {
    return makeDemoResponse(config, { msg: "Password reset successfully. You can now sign in." }, 200);
  }

  // FAQ
  if ((url.includes("api/faq") || url.endsWith("faq")) && method === "get") {
    const demoFaq = [
      { category: "For Beginners", items: [
        { question: "How do I know how many calories I should eat each day?", answer: "A good starting point is to use an online calculator based on your age, weight, height, and activity level. Most adults need between 1,800–2,500 calories per day. JBFitness uses 2,200 as a default goal—you can adjust this in your settings as you learn what works for you." },
        { question: "What's the difference between calories consumed and calories burned?", answer: "Calories consumed are what you eat and drink. Calories burned are what your body uses through daily activity and exercise. To lose weight, you generally need to burn more than you consume. To gain weight or build muscle, you may need to consume more." },
        { question: "How do I log a meal if I don't know the exact nutrition info?", answer: "Use the search feature in the Nutrition tab to find similar foods. You can also estimate or enter a best guess—approximate tracking is often better than nothing. Over time, you can refine your estimates as you learn." },
        { question: "I'm new to working out—where should I start?", answer: "Start with simple, low-impact activities like walking, light jogging, or bodyweight exercises. Aim for 2–3 sessions per week and gradually increase. The Workouts tab lets you log any activity and track your progress." },
        { question: "How often should I work out to see results?", answer: "Aim for at least 150 minutes of moderate activity per week (about 30 minutes, 5 days). For strength, 2–3 sessions per week is a good start. Consistency matters more than intensity when you first begin." },
        { question: "What are macros (protein, carbs, fats) and why do they matter?", answer: "Macros are the three main nutrients: protein (muscle repair), carbs (energy), and fats (hormones, absorption). A balanced diet helps your body perform and recover. JBFitness uses goals like 200g protein, 300g carbs, and 100g fats—adjust based on your needs." },
        { question: "Is it okay to eat more on days I work out?", answer: "Yes. Many people eat slightly more on workout days to fuel recovery. The key is to stay within your overall weekly goals. You can use the dashboard to see your daily totals and adjust as needed." },
        { question: "How do I set realistic goals for weight loss or muscle gain?", answer: "For weight loss, aim for 0.5–1 lb per week. For muscle gain, aim for 0.25–0.5 lb per week. Set small, achievable goals and celebrate progress. Use the History and Dashboard tabs to track trends over time." },
      ]},
      { category: "General App Usage", items: [
        { question: "How do I add a workout to my daily log?", answer: "Go to the Workouts tab, search for your exercise, enter the duration or reps, and tap Add. The app will estimate calories burned and add it to your dashboard." },
        { question: "How do I search for and log food or meals?", answer: "Open the Nutrition tab and use the search bar to find foods. Select the food, enter the serving size, and add it to your log. Your daily macros and calories will update on the dashboard." },
        { question: "Can I edit or delete a workout or meal after logging it?", answer: "Yes. From the Workouts or Nutrition tab, find the item in your log and use the edit or delete option. Changes will reflect immediately on your dashboard." },
        { question: "How does the app calculate calories burned during exercise?", answer: "Calories are estimated using formulas based on exercise type, duration, and intensity. For strength exercises, reps and weight may be used. The estimate is a starting point—individual results vary." },
        { question: "Where can I see my weekly progress and trends?", answer: "The Dashboard shows your weekly calories burned from workouts and nutrition breakdown. Use the History tab for a longer view of your workouts and meals over time." },
        { question: "How do I change my calorie or macro goals?", answer: "Go to Settings > App Preferences (or your profile settings) to adjust calorie and macro targets. These goals will update across the app." },
        { question: "Does the app work offline, or do I need internet?", answer: "You need an internet connection to log in and sync data. Some features may be limited offline. We recommend keeping the app updated for the best experience." },
        { question: "How do I turn on dark mode or change app preferences?", answer: "Go to Settings > App Preferences. You can switch between Light and Dark mode and adjust notification preferences there." },
        { question: "Is my data private and secure?", answer: "Yes. We use encryption and secure practices to protect your data. Your information is not shared with third parties for marketing. See our Privacy Policy for full details." },
        { question: "How do I reset my password or recover my account?", answer: 'On the Sign In page, use the "Forgot password?" link. You will receive an email with instructions to reset your password. If you have trouble, contact support.' },
      ]},
    ];
    return makeDemoResponse(config, demoFaq, 200);
  }

  // Meals
  if (url === "/api/meals/daily-summary" && method === "get") {
    const meals = getStore("demo.meals", []);
    const { daily } = computeMealSummaries(meals);
    return makeDemoResponse(config, daily, 200);
  }

  if (url === "/api/meals/weekly-summary" && method === "get") {
    const meals = getStore("demo.meals", []);
    const { weekly } = computeMealSummaries(meals);
    return makeDemoResponse(config, weekly, 200);
  }

  if (url === "/api/meals" && method === "post") {
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

  if (url === "/api/meals" && method === "get") {
    const meals = getStore("demo.meals", []);
    return makeDemoResponse(config, meals, 200);
  }

  // Workouts
  if (url === "/api/workouts/weekly-summary" && method === "get") {
    const workouts = getStore("demo.workouts", []);
    return makeDemoResponse(config, computeWorkoutWeekly(workouts), 200);
  }

  // Nutrition search (demo)
  if (url === "/api/nutrition/search" && method === "post") {
    const q = (body.query || "").toLowerCase();
    const foods = [
      { name: "Chicken Breast", serving_qty: 1, serving_unit: "piece", calories: 165, protein: 31, carbs: 0, fats: 3.6 },
      { name: "Oatmeal", serving_qty: 1, serving_unit: "cup", calories: 158, protein: 6, carbs: 27, fats: 3.2 },
      { name: "Apple", serving_qty: 1, serving_unit: "medium", calories: 95, protein: 0.5, carbs: 25, fats: 0.3 },
      { name: "Banana", serving_qty: 1, serving_unit: "medium", calories: 105, protein: 1.3, carbs: 27, fats: 0.4 },
    ];

    const results = foods.filter(f => f.name.toLowerCase().includes(q) || q === "").slice(0, 10);
    return makeDemoResponse(config, { message: "Found", results }, 200);
  }

  // Exercises search (demo)
  if (url === "/api/exercises/search" && method === "post") {
    const q = (body.query || "").toLowerCase();
    const exercises = [
      { name: "Push Ups", type: "Strength", muscle: "Chest", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Perform push ups with good form." },
      { name: "Sit Ups", type: "Strength", muscle: "Abdominals", equipment: "Bodyweight", difficulty: "Intermediate", instructions: "Lie on back and lift your torso." },
      { name: "Running", type: "Cardio", muscle: "Full Body", equipment: "None", difficulty: "Intermediate", instructions: "Run at a steady pace." },
      { name: "Squats", type: "Strength", muscle: "Quads", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Lower hips and return to standing." },
    ];

    const results = exercises.filter(e => e.name.toLowerCase().includes(q) || q === "").slice(0, 10);
    return makeDemoResponse(config, { message: "Found exercises", results }, 200);
  }

  // Exercises calorie calculation (demo)
  if (url === "/api/exercises/calculate-calories" && method === "post") {
    const exerciseName = body.exerciseName || "exercise";
    const reps = Number(body.reps) || 0;
    // simple heuristic: 0.2 cal per rep default
    let factor = 0.2;
    if (exerciseName.toLowerCase().includes("push")) factor = 0.4;
    if (exerciseName.toLowerCase().includes("sit")) factor = 0.15;
    if (exerciseName.toLowerCase().includes("run")) factor = 0.3;
    const calories = Math.max(1, Math.round(factor * reps));
    return makeDemoResponse(config, { calories }, 200);
  }

  if (url === "/api/workouts" && method === "post") {
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

  if (url === "/api/workouts" && method === "get") {
    const workouts = getStore("demo.workouts", []);
    return makeDemoResponse(config, workouts, 200);
  }

  // Workout weekly summary (demo)
  if (url === "/api/workouts/weekly-summary" && method === "get") {
    const workouts = getStore("demo.workouts", []);
    const workoutWeekly = computeWorkoutWeekly(workouts);
    
    // Map to include totalCalories for each day
    const result = last7DaysISO().map(day => {
      const dayWorkouts = workouts.filter(w => w.day === day);
      return {
        day,
        totalWorkouts: dayWorkouts.length,
        totalCalories: dayWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0)
      };
    });
    
    return makeDemoResponse(config, result, 200);
  }

  // Dashboard
  if (url === "/api/dashboard" && method === "get") {
    const meals = getStore("demo.meals", []);
    const workouts = getStore("demo.workouts", []);

    const { daily, weekly } = computeMealSummaries(meals);
    const workoutWeekly = computeWorkoutWeekly(workouts);

    const weeklyProgress = weekly.map((d) => d.totalCalories);
    const todayWorkouts = workoutWeekly.find((d) => d.day === todayISO())?.totalWorkouts || 0;
    const demoWater = getStore("demo.water", 0);

    return makeDemoResponse(config, { calories: daily.totalCalories, workouts: todayWorkouts, water: demoWater, weeklyProgress }, 200);
  }

  // Water increment (demo)
  if (url === "/api/metrics/water" && method === "post") {
    const current = getStore("demo.water", 0);
    const updated = Math.min(current + 1, 8);
    setStore("demo.water", updated);
    return makeDemoResponse(config, { water: updated }, 201);
  }

  // Default demo
  return makeDemoResponse(config, {}, 200);
};

// ----------------------------
// Axios instance
// ----------------------------
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  adapter: DEMO_MODE ? demoAdapter : undefined,
});

// Automatically attach token + normalize URL
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    };

    return config;
  },
  (error) => Promise.reject(error)
);

// 🔍 Export helper function for food search
export const searchFoodsAPI = async (query, token) => {
  try {
    const response = await API.get("/meals/search", {
      params: { query },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Food search error:", error);
    throw error;
  }
};

export default API;
