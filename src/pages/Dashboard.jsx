import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api.js";
import Logo from "../components/Logo";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  // Summary data (calories only)
  const [summaryData, setSummaryData] = useState({
    calories: { current: 0, goal: 2200, label: "Cal" },
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
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        // 1️⃣ Fetch dashboard summary
        const dashRes = await API.get("/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dashData = dashRes.data ?? {};

        // 2️⃣ Fetch daily nutrition summary
        const dailyRes = await API.get("/meals/daily-summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dailyData = dailyRes.data ?? {
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFats: 0,
        };

        setSummaryData({
          calories: {
            current: dailyData.totalCalories,
            goal: 2200,
            label: "Cal",
          },
        });

        setDailySummary(dailyData);

        // 3️⃣ Weekly nutrition summary
        const weeklyRes = await API.get("/meals/weekly-summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWeeklySummary(weeklyRes.data ?? []);

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

        // 5️⃣ Weekly workout summary (calories burned per day)
        const workoutsWeeklyRes = await API.get("/workouts/weekly-summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const rawData = workoutsWeeklyRes.data ?? [];
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          last7Days.push(d.toISOString().slice(0, 10));
        }
        const byDay = new Map(rawData.map((d) => [String(d.day).slice(0, 10), d]));
        const safeWorkoutData = last7Days.map((day) => {
          const row = byDay.get(day);
          return {
            day,
            totalCalories: row?.totalCalories ?? 0,
          };
        });
        setWeeklyWorkoutSummary(safeWorkoutData);

        // 6️⃣ Saved workouts
        const workoutsRes = await API.get("/workouts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSavedWorkouts(workoutsRes.data ?? []);

        // 7️⃣ Saved meals
        const mealsRes = await API.get("/meals", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSavedMeals(mealsRes.data ?? []);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    };

    fetchData();
  }, [navigate]);

  // 🔹 Single function to fetch weekly summary safely (used by chart)
  const fetchWeeklySummary = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await API.get("/workouts/weekly-summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rawData = res.data ?? [];
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d.toISOString().slice(0, 10));
      }
      const byDay = new Map(rawData.map((d) => [String(d.day).slice(0, 10), d]));
      const safeData = last7Days.map((day) => {
        const row = byDay.get(day);
        return { day, totalCalories: row?.totalCalories ?? 0 };
      });
      setWeeklyWorkoutSummary(safeData);
      console.log("Weekly workout summary:", safeData);
    } catch (err) {
      console.error("Failed to fetch weekly workout summary", err);
    }
  };

  // 🔹 Delete meal
  const handleDeleteMeal = async (mealId) => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");
    try {
      await API.delete(`/meals/${mealId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const mealsRes = await API.get("/meals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedMeals(mealsRes.data ?? []);
      const dailyRes = await API.get("/meals/daily-summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDailySummary(
        dailyRes.data ?? { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0 }
      );
      const weeklyRes = await API.get("/meals/weekly-summary", {
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
      await API.delete(`/workouts/${workoutId}`);
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
        "/workouts/start",
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

  const dailyMacroData = [
    { label: "Calories", value: dailySummary.totalCalories, max: 2500 },
    { label: "Protein", value: dailySummary.totalProtein, max: 200 },
    { label: "Carbs", value: dailySummary.totalCarbs, max: 300 },
    { label: "Fats", value: dailySummary.totalFats, max: 100 },
  ];

  const todayISO = () => new Date().toISOString().slice(0, 10);
  const getDay = (item) => {
    if (item.created_at) return String(item.created_at).slice(0, 10);
    if (item.day) return String(item.day).slice(0, 10);
    return null;
  };
  const todaysMeals = savedMeals.filter((m) => getDay(m) === todayISO());
  const todaysWorkouts = savedWorkouts.filter((w) => getDay(w) === todayISO());



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
          <div className="profile-icon" onClick={() => navigate("/settings")}>
            <span>JD</span>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Daily Calories Summary Card */}
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-header">
              <h3>Daily Calories</h3>
              <span className="card-icon">{summaryData.calories.label}</span>
            </div>
            <div className="card-content">
              <div className="card-value">
                <span className="current">{dailySummary.totalCalories}</span>
                <span className="goal">of {summaryData.calories.goal} goal</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${calculateProgress(
                      summaryData.calories.current,
                      summaryData.calories.goal
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="weekly-progress nutrition-breakdown">
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
              stroke="rgba(0,0,0,0.08)"
              strokeWidth="1"
            />
          ))}

          {/* bars */}
          {dailyMacroData.map((item, i) => {
            const height = item.max > 0
              ? Math.min(item.value / item.max, 1) * 180
              : 0;
            return (
              <g key={i}>
                <rect
                  x={i * 150 + 70}
                  y={200 - height}
                  width="70"
                  height={height}
                  rx="8"
                  fill={["#2e7d32", "#4caf50", "#66bb6a", "#81c784"][i]}
                />
              </g>
            );
          })}
        </svg>

        <div className="graph-x-axis nutrition-bars-labels">
          {dailyMacroData.map((item, i) => (
            <div key={i} className="x-tick">
              <span className="bar-label">{item.label}</span>
              <span className="bar-value">{item.value} / {item.max}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
</div>



        <div className="weekly-progress">
  <h2 className="section-title">Calories Burned During Workouts</h2>
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
              stroke="#00000033"
              strokeWidth="1"
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
          {weeklyWorkoutSummary.map((d, i) => {
            const dObj = d.day ? new Date(d.day + "T12:00:00") : null;
            const label = dObj && !isNaN(dObj.getTime())
              ? dObj.toLocaleDateString("en-US", { weekday: "short" })
              : "—";
            return (
              <div key={i} className="x-tick">{label}</div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
</div>



        {/* Today's Workouts */}
        <div className="saved-section">
          <div className="section-header">
            <h2 className="section-title">Today's Workouts</h2>
            <button
              className="view-past-btn"
              onClick={() => navigate("/history")}
            >
              View past workouts
            </button>
          </div>
         <div className="workout-cards">
  {todaysWorkouts.length === 0 ? (
    <p className="empty-today">No workouts today. <button className="inline-link" onClick={() => navigate("/workouts")}>Add one</button></p>
  ) : todaysWorkouts.map((workout) => (
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
          <span className="info-value">{workout.calories_burned ?? workout.calories ?? 0} cal</span>
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

        {/* Today's Meals */}
        <div className="saved-section">
          <div className="section-header">
            <h2 className="section-title">Today's Meals</h2>
            <button
              className="view-past-btn"
              onClick={() => navigate("/history")}
            >
              View past meals
            </button>
          </div>
          <div className="meal-cards">
            {todaysMeals.length === 0 ? (
              <p className="empty-today">No meals today. <button className="inline-link" onClick={() => navigate("/nutrition")}>Add one</button></p>
            ) : todaysMeals.map((m) => (
              <div key={m.id} className="meal-card">
                <div className="meal-header">
                  <h3>{m.title ?? m.name ?? "Meal"}</h3>
                <button
                  className="delete-meal-btn"
                  onClick={() => handleDeleteMeal(m.id)}
                >
                  🗑
                </button>
                </div>
                
                <p className="meal-description">{m.description ?? ""}</p>
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
