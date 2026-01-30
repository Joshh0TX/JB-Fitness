import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import NotificationIcon from "../components/NotificationIcon";
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
        fetch("http://localhost:5000/api/meals/summary/daily", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/meals/summary/weekly", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!dailyRes.ok || !weeklyRes.ok)
        throw new Error("Failed to fetch summaries");

      const dailyData = await dailyRes.json();
      const weeklyData = await weeklyRes.json();
      console.log("DAILY SUMMARY JSON FROM BACKEND:", dailyData);

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
      const dailyRes = await fetch("http://localhost:5000/api/meals/summary/daily", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (dailyRes.ok) setDailySummary(await dailyRes.json());

      const weeklyRes = await fetch("http://localhost:5000/api/meals/summary/weekly", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (weeklyRes.ok) setWeeklySummary(await weeklyRes.json());
    } catch (error) {
      console.error("Failed to refresh nutrition data:", error);
    }
  };

  useEffect(() => {
    if (!token) return navigate("/login");
    refreshNutritionData();
  }, [token, navigate]);

  // ✅ Add meal and refresh summaries immediately
  const addToToday = async (meal) => {
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/meals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: meal.title,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fats: meal.fats,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to add meal");
      }

      alert("Meal added to today ✅");

      // 🔄 Refresh daily and weekly summaries immediately
      fetchSummaries();
    } catch (error) {
      console.error("Add meal error:", error);
      alert("Failed to add meal ❌");
    }
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

        {/* ✅ Updated Daily Summary */}
        <div className="daily-summary">
          <h2>Today's Meals Summary</h2>
          <p>Calories: {dailySummary.totalCalories}</p>
          <p>Protein: {dailySummary.totalProtein}g</p>
          <p>Carbs: {dailySummary.totalCarbs}g</p>
          <p>Fats: {dailySummary.totalFats}g</p>
        </div>

        {/* ✅ Weekly Chart */}
        <div className="weekly-summary">
          <h2>Weekly Progress (Calories)</h2>
          <div className="chart">
            {weeklySummary.length === 0 ? (
              <p>No meals this week</p>
            ) : (
              <div className="bar-chart">
                {weeklySummary.map((day, i) => (
                  <div key={i} className="bar-container">
                    <div
                      className="bar"
                      style={{
                        height: `${(day.totalCalories / 3000) * 100}%`,
                      }}
                    ></div>
                    <span className="bar-label">
                      {new Date(day.day).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Nutrition;
