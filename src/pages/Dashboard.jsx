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
    workouts: { current: 0, goal: 7, label: "Workouts" },
    water: { current: 0, goal: 8, label: "Glasses" },
  });

  // User initials
  const [userInitials, setUserInitials] = useState("JD");

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

    // 🔹 Get user initials from localStorage
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        const username = user.username || user.name || "User";
        const initials = username
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        setUserInitials(initials || "JD");
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage:", error);
    }

    const fetchData = async () => {
      try {
        // 1️⃣ Fetch dashboard summary (today's metrics, workouts count, water count)
        const dashRes = await API.get("/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // 2️⃣ Fetch daily nutrition summary
        const dailyRes = await API.get("/api/meals/daily-summary", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // 3️⃣ Fetch weekly workout breakdown (calories per day)
        const weeklyWorkoutRes = await API.get("/api/workouts/weekly-summary", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const dailyData = dailyRes.data ?? {
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFats: 0,
        };

        const dashData = dashRes.data ?? {
          calories: 0,
          workouts: 0,
          water: 0,
          weeklyProgress: []
        };

        // Set summary cards from dashboard data
        setSummaryData({
          calories: {
            current: dailyData.totalCalories,
            goal: 2200,
            label: "Cal",
          },
          workouts: {
            current: dashData.workouts ?? 0,
            goal: 7,
            label: "Workouts",
          },
          water: {
            current: dashData.water ?? 0,
            goal: 8,
            label: "Glasses",
          },
        });

        setDailySummary(dailyData);

        // 4️⃣ Weekly chart data (nutrition calories)
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

        // 5️⃣ Weekly workout summary (calories burned from workouts per day)
        const weeklyWorkoutData = (weeklyWorkoutRes.data ?? []).map(d => ({
          day: d.day || new Date().toISOString(),
          totalCalories: d.totalCalories ?? 0,
          totalWorkouts: d.totalWorkouts ?? 0
        }));

        setWeeklyWorkoutSummary(weeklyWorkoutData);


        // 6️⃣ Saved workouts
        const workoutsRes = await API.get("/api/workouts", {
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

    // Fetch initially
    fetchData();

    // Refresh when workouts or water change elsewhere in the app
    const onWorkout = () => fetchData();
    const onWater = (e) => {
      // Optimistically update water count from the event detail immediately
      const newWater = e?.detail?.water;
      if (newWater != null) {
        setSummaryData((prev) => ({
          ...prev,
          water: { ...prev.water, current: newWater },
        }));
      }
      // Also re-fetch full dashboard data in background
      fetchData();
    };
    window.addEventListener('workoutAdded', onWorkout);
    window.addEventListener('waterUpdated', onWater);

    return () => {
      window.removeEventListener('workoutAdded', onWorkout);
      window.removeEventListener('waterUpdated', onWater);
    };
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
      await API.delete(`/api/workouts/${workoutId}`);
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

  // Dynamic max for workout calories chart
  const maxWorkoutCalories = Math.max(
    ...weeklyWorkoutSummary.map((d) => d.totalCalories ?? 0),
    100 // minimum scale
  );
  // Round up to nearest nice number for y-axis
  const niceMax = (() => {
    if (maxWorkoutCalories <= 100) return 100;
    if (maxWorkoutCalories <= 250) return 250;
    if (maxWorkoutCalories <= 500) return 500;
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxWorkoutCalories)));
    return Math.ceil(maxWorkoutCalories / magnitude) * magnitude;
  })();
  const yTicks = [niceMax, Math.round(niceMax * 0.75), Math.round(niceMax * 0.5), Math.round(niceMax * 0.25), 0];

  // Weekly workout totals
  const weeklyTotalCalories = weeklyWorkoutSummary.reduce((s, d) => s + (d.totalCalories ?? 0), 0);
  const weeklyTotalWorkouts = weeklyWorkoutSummary.reduce((s, d) => s + (d.totalWorkouts ?? 0), 0);

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
            <span>{userInitials}</span>
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



        <div className="weekly-progress workout-chart-section">
  <div className="section-header">
    <h2 className="section-title">Calories Burned from Workouts</h2>
    <div className="workout-stats-badges">
      <span className="workout-cal-badge">
        {weeklyTotalCalories.toLocaleString()} cal this week
      </span>
      <span className="workout-count-badge">
        {weeklyTotalWorkouts} workout{weeklyTotalWorkouts !== 1 ? "s" : ""}
      </span>
    </div>
  </div>

  <div className="graph-container">
    <div className="graph">
      <div className="graph-y-axis">
        {yTicks.map((v) => (
          <div key={v} className="y-tick">{v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}</div>
        ))}
      </div>
      <div className="graph-content">
        <svg
          className="graph-svg"
          viewBox="0 0 700 240"
          preserveAspectRatio="none"
        >
          {/* Horizontal grid lines */}
          {[0, 60, 120, 180, 240].map((y, i) => (
            <line
              key={i}
              x1="0"
              y1={y}
              x2="700"
              y2={y}
              stroke="#e0e0e0"
              strokeWidth="1"
              strokeDasharray={i > 0 && i < 4 ? "6 4" : "none"}
            />
          ))}

          {/* Calories bars from workouts */}
          {weeklyWorkoutSummary.map((d, i) => {
            const cal = d.totalCalories ?? 0;
            const barHeight = niceMax > 0 ? (cal / niceMax) * 210 : 0;
            const barWidth = 52;
            const dayWidth = 700 / 7;
            const x = i * dayWidth + (dayWidth - barWidth) / 2;
            const y = 230 - barHeight;
            const today = new Date().toISOString().split("T")[0];
            const isToday = d.day === today;

            return (
              <g key={i}>
                {/* Bar with rounded top */}
                <defs>
                  <linearGradient id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isToday ? "#ff7043" : "#ff8a65"} />
                    <stop offset="100%" stopColor={isToday ? "#e64a19" : "#ff5722"} />
                  </linearGradient>
                </defs>
                {barHeight > 0 && (
              <rect
                x={x}
                y={y}
                width={barWidth}
                    height={barHeight}
                rx="6"
                    ry="6"
                    fill={`url(#barGrad${i})`}
                    opacity={isToday ? 1 : 0.75}
                  />
                )}
                {/* Calorie label on top of bar */}
                {cal > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill={isToday ? "#e64a19" : "#ff5722"}
                  >
                    {cal}
                  </text>
                )}
                {/* Zero indicator for empty days */}
                {cal === 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={225}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="500"
                    fill="#bbb"
                  >
                    —
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* X-axis: day name + workout count */}
        <div className="graph-x-axis workout-x-axis">
          {weeklyWorkoutSummary.map((d, i) => {
            const today = new Date().toISOString().split("T")[0];
            const isToday = d.day === today;
            const count = d.totalWorkouts ?? 0;
            return (
              <div key={i} className={`x-tick ${isToday ? "x-tick-today" : ""}`}>
                <span className="x-day-label">
                  {new Date(d.day + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                {count > 0 && (
                  <span className="x-workout-count">
                    {count} {count === 1 ? "wkt" : "wkts"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>

    {/* Chart legend */}
    <div className="chart-legend">
      <div className="legend-item">
        <span className="legend-color" style={{ background: "linear-gradient(135deg, #ff7043, #e64a19)" }}></span>
        Today
      </div>
      <div className="legend-item">
        <span className="legend-color" style={{ background: "linear-gradient(135deg, #ff8a65, #ff5722)", opacity: 0.75 }}></span>
        Other days
      </div>
    </div>
  </div>
</div>

{/* Today's Macro Distribution */}
<div className="macro-cards">
  <h2 className="section-title">Today's Macro Distribution</h2>
  <div className="macro-grid">
    <div className="macro-card protein">
      <div className="macro-circle">
        <svg viewBox="0 0 100 100" className="macro-pie">
          <circle cx="50" cy="50" r="45" fill="#f5f5f5" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#4caf50"
            strokeWidth="8"
            strokeDasharray={`${(dailySummary.totalProtein / 200) * 282.7} 282.7`}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="macro-label">
          <p className="macro-value">{dailySummary.totalProtein}</p>
          <p className="macro-unit">g</p>
        </div>
      </div>
      <h3>Protein</h3>
      <p className="macro-goal">Goal: 200g</p>
      <div className="macro-progress">
        <div
          className="macro-progress-bar"
          style={{
            width: `${Math.min((dailySummary.totalProtein / 200) * 100, 100)}%`,
            backgroundColor: '#4caf50',
          }}
        ></div>
      </div>
    </div>

    <div className="macro-card carbs">
      <div className="macro-circle">
        <svg viewBox="0 0 100 100" className="macro-pie">
          <circle cx="50" cy="50" r="45" fill="#f5f5f5" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#ffc107"
            strokeWidth="8"
            strokeDasharray={`${(dailySummary.totalCarbs / 300) * 282.7} 282.7`}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="macro-label">
          <p className="macro-value">{dailySummary.totalCarbs}</p>
          <p className="macro-unit">g</p>
        </div>
      </div>
      <h3>Carbs</h3>
      <p className="macro-goal">Goal: 300g</p>
      <div className="macro-progress">
        <div
          className="macro-progress-bar"
          style={{
            width: `${Math.min((dailySummary.totalCarbs / 300) * 100, 100)}%`,
            backgroundColor: '#ffc107',
          }}
        ></div>
      </div>
    </div>

    <div className="macro-card fats">
      <div className="macro-circle">
        <svg viewBox="0 0 100 100" className="macro-pie">
          <circle cx="50" cy="50" r="45" fill="#f5f5f5" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#ff9800"
            strokeWidth="8"
            strokeDasharray={`${(dailySummary.totalFats / 100) * 282.7} 282.7`}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="macro-label">
          <p className="macro-value">{dailySummary.totalFats}</p>
          <p className="macro-unit">g</p>
        </div>
      </div>
      <h3>Fats</h3>
      <p className="macro-goal">Goal: 100g</p>
      <div className="macro-progress">
        <div
          className="macro-progress-bar"
          style={{
            width: `${Math.min((dailySummary.totalFats / 100) * 100, 100)}%`,
            backgroundColor: '#ff9800',
          }}
        ></div>
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
