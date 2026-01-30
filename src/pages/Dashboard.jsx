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
    workouts: { current: 1, goal: 5, label: "Workouts" },
    water: { current: 3, goal: 8, label: "Glasses" },
  });

  // New: Daily summary
  const [dailySummary, setDailySummary] = useState({
  totalCalories: 0,
  totalProtein: 0,
  totalCarbs: 0,
  totalFats: 0,
});


  // Weekly summary for charts
  const [weeklySummary, setWeeklySummary] = useState([]);

  const [weeklyData, setWeeklyData] = useState([]);
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [savedMeals, setSavedMeals] = useState([]);
  const [weeklyWorkoutSummary, setWeeklyWorkoutSummary] = useState([]);

useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    navigate("/login");
    return;
  }

  const fetchData = async () => {
    try {
      // 1️⃣ Fetch dashboard (workouts, water, etc.)
      const dashRes = await API.get("/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dashData = dashRes.data ?? {};

      // 2️⃣ Fetch daily nutrition summary (THIS is calories)
      const dailyRes = await API.get("/meals/daily-summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dailyData = dailyRes.data ?? {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFats: 0,
      };

      // 3️⃣ Set summary cards
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

      // 4️⃣ Weekly nutrition
      const weeklyRes = await API.get("/meals/weekly-summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWeeklySummary(weeklyRes.data ?? []);

      // 5️⃣ Weekly chart (dashboard progress)
      const weeklyProgress = Array.isArray(dashData.weeklyProgress)
        ? dashData.weeklyProgress
        : [];

      setWeeklyData(
        weeklyProgress.map((cal, index) => ({
          day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index] ?? `Day ${index + 1}`,
          burned: cal,
          consumed: cal,
        }))
      );

      const workoutsWeeklyRes = await API.get("/workouts/weekly-summary", {
      headers: { Authorization: `Bearer ${token}` },
      });

      setWeeklyWorkoutSummary(workoutsWeeklyRes.data ?? []);


      // 6️⃣ Saved items
      const workoutsRes = await API.get("/workouts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedWorkouts(workoutsRes.data ?? []);

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

useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    navigate("/login");
    return;
  }

  const fetchData = async () => {
    try {
      // Dashboard summary
      const dashRes = await API.get("/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = dashRes.data ?? {};

      

      setSummaryData({
        calories: { current: data.calories ?? 0, goal: 2200, label: "Cal" },
        workouts: { current: totalWorkoutsThisWeek ?? 0, goal: 5, label: "Workouts" },
        water: { current: data.water ?? 0, goal: 8, label: "Glasses" },
      });

      // Weekly chart data
      const weeklyProgress = Array.isArray(data.weeklyProgress) ? data.weeklyProgress : [];
      setWeeklyData(
        weeklyProgress.map((cal, index) => ({
          day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index] ?? `Day ${index + 1}`,
          burned: cal,
          consumed: cal,
        }))
      );

      // Saved workouts
      const workoutsRes = await API.get("/workouts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedWorkouts(workoutsRes.data ?? []);

      const handleStartWorkout = async (workout) => {
      try {
    const response = await API.post("/workouts/start", {
      workoutId: workout.id,
      });

    if (!response.data) {
      throw new Error("No response");
    }

    navigate("/active-workout", {
      state: { workout },
    });
  } catch (error) {
    console.error(error);
    alert("Failed to start workout");
  }
      };

      setSummaryData(prev => ({
  ...prev,
  workouts: {
    current: totalWorkoutsThisWeek,
    goal: 5,
    label: "Workouts",
  },
}));


      // Saved meals
      const mealsRes = await API.get("/meals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedMeals(mealsRes.data ?? []);

      // Daily summary
      const dailyRes = await API.get("/meals/daily-summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDailySummary(dailyRes.data ?? {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFats: 0,
      });

      // Weekly summary
      const weeklyRes = await API.get("/meals/weekly-summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWeeklySummary(weeklyRes.data ?? []);

      console.log("Weekly summary from backend:", weeklyRes.data); // 🔍 Inspect backend data
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    }
  };

  fetchData();
}, [navigate]);

const handleDeleteMeal = async (mealId) => {
  const token = localStorage.getItem("token");
  if (!token) return navigate("/login");

  try {
    await API.delete(`/meals/${mealId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Refresh meals & summaries after deletion
    const mealsRes = await API.get("/meals", { headers: { Authorization: `Bearer ${token}` }});
    setSavedMeals(mealsRes.data ?? []);

    const dailyRes = await API.get("/meals/daily-summary", { headers: { Authorization: `Bearer ${token}` }});
    setDailySummary(dailyRes.data ?? { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0 });

    const weeklyRes = await API.get("/meals/weekly-summary", { headers: { Authorization: `Bearer ${token}` }});
    setWeeklySummary(weeklyRes.data ?? []);
  } catch (error) {
    console.error("Delete meal failed", error);
    alert("Failed to delete meal");
  }
};

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

  const maxWorkouts = Math.max(
  ...weeklyWorkoutSummary.map(d => d.totalWorkouts),
  1
);



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



        {/* Weekly Summary Chart */}
        <div className="weekly-progress">
          <h2 className="section-title">Weekly Progress</h2>
          <div className="graph-container">
            <div className="graph-legend">
              <div className="legend-item">
                <span className="legend-line burned"></span>Calories Burned
              </div>
              <div className="legend-item">
                <span className="legend-line consumed"></span>Calories Consumed
              </div>
            </div>
            <div className="graph">
              <div className="graph-y-axis">
                {[3500, 3000, 2500, 2000, 0].map((v) => (
                  <div key={v} className="y-tick">
                    {v}
                  </div>
                ))}
              </div>
              <div className="graph-content">
                <svg
                  className="graph-svg"
                  viewBox="0 0 700 200"
                  preserveAspectRatio="none"
                >
                  {[0, 50, 100, 150, 200].map((y, i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={y}
                      x2="700"
                      y2={y}
                      stroke="#000000"
                      strokeWidth="1"
                    />
                  ))}
                  <polyline
                    points={weeklySummary
                      .map(
                        (d, i) =>
                          `${i * 100 + 50},${
                            200 - (d.totalCalories / Math.max(...weeklySummary.map(w => w.totalCalories || 1))) * 180
                          }`
                      )
                      .join(" ")}
                    fill="none"
                    stroke="#424242"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="graph-x-axis">
                  {weeklySummary.map((d, i) => (
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
