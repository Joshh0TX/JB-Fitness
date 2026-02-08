import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import NotificationIcon from "../components/NotificationIcon";
import API from "../api.js";
import "./Nutrition.css";

function Nutrition() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // ✅ States
  const [dailySummary, setDailySummary] = useState({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0,
  });

  const [weeklySummary, setWeeklySummary] = useState([]);

  // Recommended meals
  const recommendedMeals = [
    {
      title: "Mediterranean Quinoa Bowl",
      description: "A balanced meal with quinoa, vegetables, and healthy fats",
      calories: 420,
      protein: 18,
      carbs: 55,
      fats: 12,
      category: "Lunch",
      prepTime: "25 min",
    },
    {
      title: "Overnight Oats with Berries",
      description: "High-fiber breakfast with protein and antioxidants",
      calories: 320,
      protein: 12,
      carbs: 48,
      fats: 8,
      category: "Breakfast",
      prepTime: "5 min",
    },
    {
      title: "Grilled Salmon with Vegetables",
      description: "Lean protein with roasted seasonal vegetables",
      calories: 450,
      protein: 38,
      carbs: 25,
      fats: 20,
      category: "Dinner",
      prepTime: "30 min",
    },
  ];


  // ✅ Fetch initial daily & weekly summaries
  const fetchSummaries = async () => {
    if (!token) return;

    try {
      const [dailyRes, weeklyRes] = await Promise.all([
        API.get("/api/meals/daily-summary", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        API.get("/api/meals/weekly-summary", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const dailyData = dailyRes.data;
      const weeklyData = weeklyRes.data;

      setDailySummary(dailyData);
      setWeeklySummary(weeklyData);
    } catch (error) {
      console.error("Summary fetch error:", error);
    }
  };

  useEffect(() => {
    fetchSummaries();
  }, []);

  // ✅ Refresh daily & weekly summaries
  const refreshNutritionData = async () => {
    if (!token) return;

    try {
      const [dailyRes, weeklyRes] = await Promise.all([
        API.get("/api/meals/daily-summary", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        API.get("/api/meals/weekly-summary", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setDailySummary(dailyRes.data);
      setWeeklySummary(weeklyRes.data);
    } catch (error) {
      console.error("Failed to refresh nutrition data:", error);
    }
  };

  useEffect(() => {
    if (!token) return navigate("/api/login");
    refreshNutritionData();
  }, [token, navigate]);

  // ✅ Add meal and refresh summaries immediately
  const addToToday = async (meal) => {
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/api/login");
      return;
    }

    try {
      const res = await API.post(
        "/api/meals",
        {
          name: meal.title,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fats: meal.fats,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res?.data) {
        throw new Error("Failed to add meal");
      }

      alert("Meal added to today");

      // 🔄 Refresh daily and weekly summaries immediately
      fetchSummaries();
    } catch (error) {
      console.error("Add meal error:", error);
      alert(error.response?.data?.message || "Failed to add meal");
    }

    return;
  };

  return (
    <div className="nutrition-page">
      <header className="nutrition-header">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          ←
        </button>
        <h1>Nutrition</h1>
        <NotificationIcon />
      </header>

      <main className="nutrition-main">
        <div className="meals-grid">
          {recommendedMeals.map((meal, index) => (
            <div key={index} className="meal-card">
              <h3>{meal.title}</h3>
              <p>{meal.description}</p>

              <div className="meal-nutrition">
                <span>{meal.calories} cal</span>
                <span>{meal.protein}g protein</span>
                <span>{meal.carbs}g carbs</span>
                <span>{meal.fats}g fats</span>
              </div>

              <button
                className="add-meal-btn"
                onClick={() => addToToday(meal)}
              >
                Add to Today
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Nutrition;
