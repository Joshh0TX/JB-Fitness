import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api.js";
import NotificationIcon from "../components/NotificationIcon";
import Logo from "../components/Logo";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  // Existing summary data
  const [summaryData, setSummaryData] = useState({
    calories: { current: 0, goal: 2200, label: "Cal" },
    workouts: { current: 0, goal: 5, label: "Workouts" },
    water: { current: 0, goal: 8, label: "Glasses" },
  });

  // Daily summary
  const [dailySummary, setDailySummary] = useState({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0,
  });

  // Weekly summary for nutrition & charts
  const [weeklySummary, setWeeklySummary] = useState([]);

  // Weekly data for bar charts (SVG)
  const [weeklyData, setWeeklyData] = useState([]);
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [savedMeals, setSavedMeals] = useState([]);
  const [weeklyWorkoutSummary, setWeeklyWorkoutSummary] = useState([]);

  // 🔹 Fetch everything on page load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/api/login");
      return;
    }

    const fetchData = async () => {
      try {
        // 1️⃣ Fetch dashboard summary
        const dashRes = await API.get("/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
      

        // 2️⃣ Fetch daily nutrition summary
        const dailyRes = await API.get("/api/meals/daily-summary", {
          headers: { Authorization: `Bearer ${token}` },
        });


        // 3️⃣ Weekly workouts summary
        const weeklyRes = await API.get("/api/workouts/weekly-summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
      

        const dailyData = dailyRes.data ?? {
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFats: 0,
        };

        const dashData = weeklyRes.data ?? {
          totalCalories: 0
        }

        setSummaryData({
          calories: {
            current: dailyData.totalCalories,
            goal: 2200,
            label: "Cal",
          },
          workouts: {
            current: dashData.workouts ?? 0,
            goal: 5,
            label: "Workouts",
          },
          water: {
            current: dashData.water ?? 0,
            goal: 8,
            label: "Glasses",
          },
        });

        setDailySummary(dailyData);
        setWeeklyWorkoutSummary(dashData);
        
        

        // 4️⃣ Weekly chart data (burned vs consumed)
        const weeklyProgress = Array.isArray(dashData.weeklyProgress)
          ? dashData.weeklyProgress
          : [];
        setWeeklyData(
          weeklyProgress.map((cal, index) => ({
            day:
              ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index] ??
              `Day ${index + 1}`,
            burned: cal,
            consumed: cal,
          }))
        );

        // 5️⃣ Weekly workout summary
        const workoutsWeeklyRes = await API.get("/api/workouts/weekly-summary", {
        headers: { Authorization: `Bearer ${token}` },
        });
        const data = workoutsWeeklyRes.data ?? [{
        day: "",
        burned: 0,
        consumed: 1000

      }];

const weeklyWorkoutData = (workoutsWeeklyRes.data ?? []).map(d => ({
  day: d.day || new Date().toISOString(),   // fallback day
  totalCalories: d.totalCalories ?? 0,      // used by calorie line
  totalWorkouts: d.totalWorkouts ?? 0       // used by workout stats
}));

setWeeklyWorkoutSummary(weeklyWorkoutData);


        // 6️⃣ Saved workouts
        const workoutsRes = await API.get("/api/workouts/start", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSavedWorkouts(workoutsRes.data ?? []);

        // 7️⃣ Saved meals
        const mealsRes = await API.get("/api/meals", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSavedMeals(mealsRes.data ?? []);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    };

    fetchData();
  }, [navigate]);

  // 🔹 Delete meal
  const handleDeleteMeal = async (mealId) => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/api/login");
    try {
      await API.delete(`/api/meals/${mealId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const mealsRes = await API.get("/api/meals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedMeals(mealsRes.data ?? []);
      const dailyRes = await API.get("/api/meals/daily-summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDailySummary(
        dailyRes.data ?? { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0 }
      );
      const weeklyRes = await API.get("/api/meals/weekly-summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWeeklySummary(weeklyRes.data ?? []);
    } catch (error) {
      console.error("Delete meal failed", error);
      alert("Failed to delete meal");
    }
  };

  // 🔹 Delete workout
  const handleDeleteWorkout = async (workoutId) => {
    try {
      await API.delete(`/api/workouts/start/${workoutId}`);
      setSavedWorkouts((prev) =>
        prev.filter((workout) => workout.id !== workoutId)
      );
    } catch (error) {
      console.error("Failed to delete workout", error);
    }
  };

  // 🔹 Start workout
  const handleStartWorkout = async (workoutId) => {
    try {
      const workout = savedWorkouts.find((w) => w.id === workoutId);
      if (!workout) throw new Error("Workout not found");

      const response = await API.post(
        "/api/workouts/start",
        { workoutId },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      if (!response.data) throw new Error("No response");

      navigate("/active-workout", { state: { workout } });
    } catch (error) {
      console.error("Start workout error:", error);
      alert("Failed to start workout");
    }
  };

  // 🔹 Utility
  const calculateProgress = (current, goal) => Math.min((current / goal) * 100, 100);
  const maxCalories = Math.max(
    ...weeklyData.map((d) => Math.max(d.burned || 0, d.consumed || 0)),
    1
  );
  const maxWorkouts = Math.max(...weeklyWorkoutSummary.map((d) => d.totalWorkouts), 1);

  const dailyMacroData = [
    { label: "Calories", value: dailySummary.totalCalories, max: 2500 },
    { label: "Protein", value: dailySummary.totalProtein, max: 200 },
    { label: "Carbs", value: dailySummary.totalCarbs, max: 300 },
    { label: "Fats", value: dailySummary.totalFats, max: 100 },
  ];



  return (
    <div className="dashboard page-animate">
      <header className="dashboard-header">
        <div className="header-left">
          <Logo />
        </div>
        <div className="header-tabs">
          <button className="tab" onClick={() => navigate("/nutrition")}>
            Nutrition
          </button>
          <button className="tab" onClick={() => navigate("/workouts")}>
            Workout
          </button>
        </div>
        <div className="header-right">
          <NotificationIcon />
          <div className="profile-icon" onClick={() => navigate("/settings")}>
            <span>JD</span>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Existing Summary Cards */}
        <div className="summary-cards">
          {["calories", "workouts", "water"].map((key) => (
            <div key={key} className="summary-card">
              <div className="card-header">
                <h3>
                  {key === "calories"
                    ? "Daily Calories"
                    : key === "workouts"
                    ? "Workouts This Week"
                    : "Water Intake"}
                </h3>
                <span className="card-icon">{summaryData[key].label}</span>
              </div>
              <div className="card-content">
                <div className="card-value">
  <span className="current">
    {key === "calories"
      ? dailySummary.totalCalories
      : summaryData[key].current}
  </span>

  <span className="goal">
    of {summaryData[key].goal}{" "}
    {key === "water"
      ? "glasses"
      : key === "calories"
      ? "goal"
      : "planned"}
  </span>
</div>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${calculateProgress(
                        summaryData[key].current,
                        summaryData[key].goal
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="weekly-progress">
  <h2 className="section-title">Today's Nutrition Breakdown</h2>

  <div className="graph-container">
    <div className="graph">
      <div className="graph-y-axis">
        {[100, 75, 50, 25, 0].map((v) => (
          <div key={v} className="y-tick">{v}%</div>
        ))}
      </div>

      <div className="graph-content">
        <svg
          className="graph-svg"
          viewBox="0 0 700 200"
          preserveAspectRatio="none"
        >
          {/* grid lines */}
          {[0, 50, 100, 150, 200].map((y, i) => (
            <line
              key={i}
              x1="0"
              y1={y}
              x2="700"
              y2={y}
              stroke="#000000bb"
              strokeWidth="1.5"
            />
          ))}

          {/* bars */}
          {dailyMacroData.map((item, i) => {
            const height =
              Math.min(item.value / item.max, 1) * 180;
            return (
              <rect
                key={i}
                x={i * 150 + 70}
                y={200 - height}
                width="70"
                height={height}
                rx="8"
                fill={["#424242", "#616161", "#757575", "#9e9e9e"][i]}

              />
            );
          })}
        </svg>

        <div className="graph-x-axis">
          {dailyMacroData.map((item, i) => (
            <div key={i} className="x-tick">
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
</div>



        <div className="weekly-progress">
  <h2 className="section-title">Daily Progress</h2>
  <div className="graph-container">
    <div className="graph">
      <div className="graph-y-axis">
        {[3500, 3000, 2500, 2000, 1500, 1000, 500, 0].map((v) => (
          <div key={v} className="y-tick">{v}</div>
        ))}
      </div>
      <div className="graph-content">
        <svg
          className="graph-svg"
          viewBox="0 0 700 200"
          preserveAspectRatio="none"
        >
          {/* Horizontal grid lines */}
          {[0, 50, 100, 150, 200].map((y, i) => (
            <line
              key={i}
              x1="0"
              y1={y}
              x2="700"
              y2={y}
              stroke="#0c0c0c33"
              strokeWidth="1.5"
            />
          ))}

          {/* Calories line */}
          <polyline
            points={weeklyWorkoutSummary
              .map((d, i) => {
                const maxCalories = Math.max(
                  ...weeklyWorkoutSummary.map(w => w.totalCalories ?? 1)
                );
                const y = 200 - ((d.totalCalories ?? 0) / maxCalories) * 180;
                const x = i * 100 + 50;
                return `${x},${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="#ff5722"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* X-axis */}
        <div className="graph-x-axis">
          {weeklyWorkoutSummary.map((d, i) => (
            <div key={i} className="x-tick">
              {new Date(d.day).toLocaleDateString("en-US", { weekday: "short" })}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
</div>



        {/* Saved Workouts */}
        <div className="saved-section">
          <div className="section-header">
            <h2 className="section-title">Saved Workouts</h2>
            <a href="#view-all" className="view-all-link">
              View all
            </a>
          </div>
         <div className="workouts-grid">
  {savedWorkouts.map((workout) => (
    <div key={workout.id} className="workout-card">
      <div className="workout-card-header">
        <div>
          <h3 className="workout-title">{workout.title}</h3>
        </div>

        {/* Delete button – dashboard only */}
        <button
          className="delete-workout-btn"
          onClick={() => handleDeleteWorkout(workout.id)}
        >
          Delete
        </button>
      </div>

      <p className="workout-description">
        {workout.description}
      </p>

      <div className="workout-info">
        <div className="info-item">
          <span className="info-label">Duration</span>
          <span className="info-value">{workout.duration} min</span>
        </div>

        <div className="info-item">
          <span className="info-label">Calories</span>
          <span className="info-value">{workout.calories} cal</span>
        </div>
      </div>

      <button
        className="start-workout-btn"
        onClick={() => handleStartWorkout(workout.id)}
      >
        Start Workout
      </button>
    </div>
  ))}
</div>
</div>

        {/* Saved Meals */}
        <div className="saved-section">
          <div className="section-header">
            <h2 className="section-title">Saved Meals</h2>
            <a href="#view-all" className="view-all-link">
              View all
            </a>
          </div>
          <div className="meal-cards">
            {savedMeals.map((m) => (
              <div key={m.id} className="meal-card">
                <div className="meal-header">
                  <h3>{m.title}</h3>
                <button
                  className="delete-meal-btn"
                  onClick={() => handleDeleteMeal(m.id)}
                >
                  🗑
                </button>
                </div>
                
                <p className="meal-description">{m.description}</p>
                <div className="meal-stats">
                  <span className="stat">
                    <span className="stat-label">Calories:</span> {m.calories} cal
                  </span>
                  <span className="stat">
                    <span className="stat-label">Protein:</span> {m.protein}g
                  </span>
                  <span className="stat">
                    <span className="stat-label">Carbs:</span> {m.carbs}g
                  </span>
                  <span className="stat">
                    <span className="stat-label">Fats:</span> {m.fats}g
                  </span>
                </div>
                <button className="meal-btn">Completed</button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
