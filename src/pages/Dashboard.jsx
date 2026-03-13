import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api.js";
import Logo from "../components/Logo";
import "./Dashboard.css";

const toLocalISODate = (input = new Date()) => {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeDay = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return toLocalISODate(value);
};

function Dashboard() {
  const navigate = useNavigate();

  // Summary data (calories only)
  const [summaryData, setSummaryData] = useState({
    calories: { current: 0, goal: 2200, label: "Cal" },
    workouts: { current: 0, goal: 7, label: "Workouts" },
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
  const [walkingSummary, setWalkingSummary] = useState({
    steps: 0,
    caloriesBurned: 0,
    distanceKm: 0,
    minutesWalked: 0,
  });

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

        const walkingSummaryRes = await API.get("/api/workouts/activity-summary", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const dailyData = {
          totalCalories: Number(dailyRes?.data?.totalCalories ?? 0),
          totalProtein: Number(dailyRes?.data?.totalProtein ?? 0),
          totalCarbs: Number(dailyRes?.data?.totalCarbs ?? 0),
          totalFats: Number(dailyRes?.data?.totalFats ?? 0),
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
        const weeklyWorkoutData = (weeklyWorkoutRes.data ?? []).map((d) => {
          let dayStr = normalizeDay(d?.day);
          if (!dayStr) dayStr = toLocalISODate();
          return {
            day: dayStr,
            totalCalories: Number(d.totalCalories ?? 0), // Ensure it's a number, not string
            totalWorkouts: Number(d.totalWorkouts ?? 0)
          };
        });
        setWeeklyWorkoutSummary(weeklyWorkoutData);
        setWalkingSummary({
          steps: Number(walkingSummaryRes?.data?.steps ?? 0),
          caloriesBurned: Number(walkingSummaryRes?.data?.caloriesBurned ?? 0),
          distanceKm: Number(walkingSummaryRes?.data?.distanceKm ?? 0),
          minutesWalked: Number(walkingSummaryRes?.data?.minutesWalked ?? 0),
        });

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
    window.addEventListener('workoutAdded', onWorkout);

    return () => {
      window.removeEventListener('workoutAdded', onWorkout);
    };
  }, [navigate]);

  // 🔹 Utility
  const calculateProgress = (current, goal) => Math.min((current / goal) * 100, 100);
  const maxCalories = Math.max(
    ...weeklyData.map((d) => Math.max(d.burned || 0, d.consumed || 0)),
    1
  );

  // Ensure we have 7 days of data for the chart (fill missing days with 0)
  const sevenDaysData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = toLocalISODate(d);
    const existingData = weeklyWorkoutSummary.find(w => w.day === dayStr);
    sevenDaysData.push(existingData || { day: dayStr, totalCalories: 0, totalWorkouts: 0 });
  }

  const maxWorkoutCalories = Math.max(
    ...sevenDaysData.map((d) => d.totalCalories ?? 0),
    100
  );
  const niceMax = (() => {
    if (maxWorkoutCalories <= 100) return 100;
    if (maxWorkoutCalories <= 250) return 250;
    if (maxWorkoutCalories <= 500) return 500;
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxWorkoutCalories)));
    return Math.ceil(maxWorkoutCalories / magnitude) * magnitude;
  })();
  const yTicks = [niceMax, Math.round(niceMax * 0.75), Math.round(niceMax * 0.5), Math.round(niceMax * 0.25), 0];

  const weeklyTotalCalories = sevenDaysData.reduce((s, d) => s + (d.totalCalories ?? 0), 0);
  const weeklyTotalWorkouts = sevenDaysData.reduce((s, d) => s + (d.totalWorkouts ?? 0), 0);

  const dailyMacroData = [
    { label: "Calories", value: dailySummary.totalCalories, max: 2500 },
    { label: "Protein", value: dailySummary.totalProtein, max: 200 },
    { label: "Carbs", value: dailySummary.totalCarbs, max: 300 },
    { label: "Fats", value: dailySummary.totalFats, max: 100 },
  ];

  const nutritionChartWidth = 700;
  const nutritionChartHeight = 220;
  const nutritionChartBaseY = 200;
  const nutritionBarMaxHeight = 180;
  const nutritionSlotWidth = nutritionChartWidth / dailyMacroData.length;
  const nutritionBarWidth = Math.min(84, nutritionSlotWidth * 0.48);
  const nutritionBarColors = ["#2e7d32", "#43a047", "#66bb6a", "#81c784"];

  const macroCardsData = [
    { key: "protein", label: "Protein", value: dailySummary.totalProtein, goal: 200, color: "#4caf50" },
    { key: "carbs", label: "Carbs", value: dailySummary.totalCarbs, goal: 300, color: "#ffc107" },
    { key: "fats", label: "Fats", value: dailySummary.totalFats, goal: 100, color: "#ff9800" },
  ];

  const totalMacroGrams = macroCardsData.reduce((sum, item) => sum + item.value, 0);
  const macroDistributionData = macroCardsData.map((item) => ({
    ...item,
    percentage: totalMacroGrams > 0 ? (item.value / totalMacroGrams) * 100 : 0,
    progress: item.goal > 0 ? Math.min((item.value / item.goal) * 100, 100) : 0,
  }));

  let runningMacroPercent = 0;
  const macroConicGradient = totalMacroGrams > 0
    ? `conic-gradient(${macroDistributionData
        .map((item) => {
          const start = runningMacroPercent;
          runningMacroPercent += item.percentage;
          return `${item.color} ${start.toFixed(2)}% ${runningMacroPercent.toFixed(2)}%`;
        })
        .join(", ")})`
    : null;

  const walkingCardData = [
    {
      key: "steps",
      title: "Step Tracker",
      label: "Steps",
      current: walkingSummary.steps,
      goal: 10000,
      valueDisplay: walkingSummary.steps.toLocaleString(),
      goalSuffix: "goal",
    },
    {
      key: "caloriesBurned",
      title: "Calories Burned",
      label: "Cal",
      current: Math.round(walkingSummary.caloriesBurned),
      goal: 500,
      valueDisplay: Math.round(walkingSummary.caloriesBurned).toLocaleString(),
      goalSuffix: "target",
    },
    {
      key: "distanceWalked",
      title: "Distance Walked",
      label: "KM",
      current: Number(walkingSummary.distanceKm.toFixed(1)),
      goal: 8,
      valueDisplay: walkingSummary.distanceKm.toFixed(1),
      goalSuffix: "daily",
    },
    {
      key: "minutesWalked",
      title: "Minutes Walked",
      label: "Mins",
      current: Math.round(walkingSummary.minutesWalked),
      goal: 60,
      valueDisplay: Math.round(walkingSummary.minutesWalked).toLocaleString(),
      goalSuffix: "daily",
    },
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
          <div className="profile-icon" onClick={() => navigate("/settings")}>
            <span>{userInitials}</span>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Daily Calories Summary Card */}
        <div className="summary-cards">
          {["calories", "workouts"].map((key) => (
            <div key={key} className="summary-card">
              <div className="card-header">
                <h3>
                  {key === "calories"
                    ? "Daily Calories"
                    : key === "workouts"
                    ? "Workouts"
                    : "Water Intake"}
                </h3>
                <span className="card-icon">{summaryData[key].label}</span>
              </div>
              <div className="card-content">
                <div className="card-value">
                  <span className="current">
                    {key === "calories" ? dailySummary.totalCalories : summaryData[key].current}
                  </span>
                  <span className="goal">
                    of {summaryData[key].goal} {key === "calories" ? "goal" : "planned"}
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
          viewBox="0 0 700 220"
          preserveAspectRatio="none"
        >
          {/* grid lines */}
          {[20, 65, 110, 155, 200].map((y, i) => (
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
              ? Math.min(item.value / item.max, 1) * nutritionBarMaxHeight
              : 0;
            const x = i * nutritionSlotWidth + (nutritionSlotWidth - nutritionBarWidth) / 2;
            const y = nutritionChartBaseY - height;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={nutritionBarWidth}
                  height={height}
                  rx="8"
                  fill={nutritionBarColors[i]}
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
          {sevenDaysData.map((d, i) => {
            const cal = d.totalCalories ?? 0;
            const barHeight = niceMax > 0 ? (cal / niceMax) * 210 : 0;
            const barWidth = 52;
            const dayWidth = 700 / 7;
            const x = i * dayWidth + (dayWidth - barWidth) / 2;
            const y = 230 - barHeight;
            const today = toLocalISODate();
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
          {sevenDaysData.map((d, i) => {
            const today = toLocalISODate();
            const isToday = d.day === today;
            const count = d.totalWorkouts ?? 0;
            const dObj = d.day ? new Date(d.day + "T12:00:00") : null;
            const dayLabel = dObj && !isNaN(dObj.getTime())
              ? dObj.toLocaleDateString("en-US", { weekday: "short" })
              : "—";
            return (
              <div key={i} className={`x-tick ${isToday ? "x-tick-today" : ""}`}>
                <span className="x-day-label">{dayLabel}</span>
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

  <div className="macro-overview-card">
    <div className="macro-donut-wrap">
      <div
        className={`macro-donut ${totalMacroGrams === 0 ? "is-empty" : ""}`}
        style={macroConicGradient ? { background: macroConicGradient } : undefined}
      >
        <div className="macro-label">
          <p className="macro-label-title">Total</p>
          <p className="macro-total-value">{totalMacroGrams}g</p>
        </div>
      </div>
    </div>

    <div className="macro-breakdown">
      {macroDistributionData.map((item) => (
        <div key={item.key} className="macro-breakdown-row">
          <div className="macro-breakdown-left">
            <span className="macro-dot" style={{ backgroundColor: item.color }}></span>
            <span className="macro-breakdown-name">{item.label}</span>
          </div>
          <div className="macro-breakdown-right">
            <span className="macro-breakdown-value">{item.value}g</span>
            <span className="macro-breakdown-percent">{Math.round(item.percentage)}%</span>
          </div>
        </div>
      ))}
    </div>
  </div>

  <div className="macro-grid">
    {macroDistributionData.map((item) => (
      <div key={item.key} className={`macro-card ${item.key}`}>
        <div className="macro-card-top">
          <h3>{item.label}</h3>
          <span className="macro-unit">grams</span>
        </div>
        <p className="macro-value">{item.value}g</p>
        <p className="macro-goal">Goal: {item.goal}g</p>
        <div className="macro-progress">
          <div
            className="macro-progress-bar"
            style={{
              width: `${item.progress}%`,
              backgroundColor: item.color,
            }}
          ></div>
        </div>
        <p className="macro-progress-label">{Math.round(item.progress)}% of goal</p>
      </div>
    ))}
  </div>
</div>

<div className="activity-tracker-section">
  <h2 className="section-title">Today's Walking Activity</h2>
  <div className="summary-cards activity-summary-cards">
    {walkingCardData.map((card) => (
      <div key={card.key} className="summary-card">
        <div className="card-header">
          <h3>{card.title}</h3>
          <span className="card-icon">{card.label}</span>
        </div>
        <div className="card-content">
          <div className="card-value">
            <span className="current">{card.valueDisplay}</span>
            <span className="goal">of {card.goal} {card.goalSuffix}</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${calculateProgress(card.current, card.goal)}%` }}
            ></div>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>


      </main>
    </div>
  );
}

export default Dashboard;
