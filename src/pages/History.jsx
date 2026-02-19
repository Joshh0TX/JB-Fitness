import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api.js";
import "./History.css";

function History() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [meals, setMeals] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [loading, setLoading] = useState(true);

  const last14Days = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    // Format as YYYY-MM-DD without timezone conversion
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    last14Days.push(`${year}-${month}-${day}`);
  }

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    const fetchData = async () => {
      try {
        const [mealsRes, workoutsRes] = await Promise.all([
          API.get("/meals", { headers: { Authorization: `Bearer ${token}` } }),
          API.get("/workouts", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setMeals(mealsRes.data ?? []);
        setWorkouts(workoutsRes.data ?? []);
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, navigate]);

  const formatDateLabel = (iso) => {
    const d = new Date(iso + "T12:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dNorm = new Date(d);
    dNorm.setHours(0, 0, 0, 0);
    if (dNorm.getTime() === today.getTime()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (dNorm.getTime() === yesterday.getTime()) return "Yesterday";
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const getDay = (item) => {
    if (item.created_at) return String(item.created_at).slice(0, 10);
    if (item.day) return String(item.day).slice(0, 10);
    return null;
  };

  const mealsByDate = meals.reduce((acc, m) => {
    const day = getDay(m);
    if (day) {
      if (!acc[day]) acc[day] = [];
      acc[day].push(m);
    }
    return acc;
  }, {});

  const workoutsByDate = workouts.reduce((acc, w) => {
    const day = getDay(w);
    if (day) {
      if (!acc[day]) acc[day] = [];
      acc[day].push(w);
    }
    return acc;
  }, {});

  const dayMeals = mealsByDate[selectedDate] ?? [];
  const dayWorkouts = workoutsByDate[selectedDate] ?? [];

  if (loading) {
    return (
      <div className="history-page">
        <header className="history-header">
          <button className="back-button" onClick={() => navigate("/dashboard")}>←</button>
          <h1>Memory Bank</h1>
        </header>
        <div className="history-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <header className="history-header">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          ←
        </button>
        <h1>Memory Bank</h1>
      </header>

      <main className="history-main">
        <div className="date-picker">
          <label>View past day:</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-select"
          >
            {last14Days.map((day) => (
              <option key={day} value={day}>
                {formatDateLabel(day)}
              </option>
            ))}
          </select>
        </div>

        <section className="history-section">
          <h2>Meals on {formatDateLabel(selectedDate)}</h2>
          {dayMeals.length === 0 ? (
            <p className="empty-state">No meals logged for this day.</p>
          ) : (
            <div className="history-cards meal-cards">
              {dayMeals.map((m) => (
                <div key={m.id} className="meal-card">
                  <h3>{m.name ?? m.title ?? "Meal"}</h3>
                  <div className="meal-stats">
                    <span className="stat"><span className="stat-label">Calories:</span> {m.calories} cal</span>
                    <span className="stat"><span className="stat-label">Protein:</span> {m.protein}g</span>
                    <span className="stat"><span className="stat-label">Carbs:</span> {m.carbs}g</span>
                    <span className="stat"><span className="stat-label">Fats:</span> {m.fats}g</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="history-section">
          <h2>Workouts on {formatDateLabel(selectedDate)}</h2>
          {dayWorkouts.length === 0 ? (
            <p className="empty-state">No workouts logged for this day.</p>
          ) : (
            <div className="history-cards workout-cards">
              {dayWorkouts.map((w) => (
                <div key={w.id} className="workout-card">
                  <h3>{w.title}</h3>
                  <div className="workout-info">
                    <div className="info-item">
                      <span className="info-label">Duration</span>
                      <span className="info-value">{w.duration} min</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Calories</span>
                      <span className="info-value">{w.calories_burned ?? w.calories ?? 0} cal</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default History;
