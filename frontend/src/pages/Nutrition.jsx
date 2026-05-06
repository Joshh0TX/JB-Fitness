import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../api.js";
import Logo from "../components/Logo";
import HistoryCalendarModal from "../components/HistoryCalendarModal";
import { notify } from "../components/appNotifications";
import "./Nutrition.css";

const toLocalISODate = (input = new Date()) => {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMealDate = (meal) => {
  if (!meal) return "";
  if (typeof meal.day === "string" && meal.day.length >= 10) return meal.day.slice(0, 10);
  if (meal.created_at) return toLocalISODate(meal.created_at);
  if (meal.createdAt) return toLocalISODate(meal.createdAt);
  return "";
};

function Nutrition() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // States
  const [userInitials, setUserInitials] = useState("JD");
  const [dailySummary, setDailySummary] = useState({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0,
  });
  const [weeklySummary, setWeeklySummary] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [gramsByResult, setGramsByResult] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userMeals, setUserMeals] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [historyDate, setHistoryDate] = useState(toLocalISODate());
  const [allMeals, setAllMeals] = useState([]);
  const [historyMeals, setHistoryMeals] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const username = user.username || user.name || "User";
        const initials = username.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
        setUserInitials(initials || "JD");
      }
    } catch (e) { console.error(e); }
  }, []);

  const fetchSummaries = async () => {
    if (!token) return;
    try {
      const [dailyRes, weeklyRes, mealsRes] = await Promise.all([
        API.get("/api/meals/daily-summary", { headers: { Authorization: `Bearer ${token}` } }),
        API.get("/api/meals/weekly-summary", { headers: { Authorization: `Bearer ${token}` } }),
        API.get("/api/meals", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      // SAFETY: Force data to be an array. If mealsRes.data is not an array, use []
      const mealsData = Array.isArray(mealsRes.data) ? mealsRes.data : [];
      
      setDailySummary({
        totalCalories: Number(dailyRes?.data?.totalCalories ?? 0),
        totalProtein: Number(dailyRes?.data?.totalProtein ?? 0),
        totalCarbs: Number(dailyRes?.data?.totalCarbs ?? 0),
        totalFats: Number(dailyRes?.data?.totalFats ?? 0),
      });

      setWeeklySummary(Array.isArray(weeklyRes.data) ? weeklyRes.data : []);
      setAllMeals(mealsData);
      
      const todayStr = toLocalISODate();
      setUserMeals(mealsData.filter((m) => getMealDate(m) === todayStr));
    } catch (error) {
      console.error("Summary fetch error:", error);
      setAllMeals([]); // Default to empty array on crash
    }
  };

  useEffect(() => { fetchSummaries(); }, []);

  const getResultKey = (result, index) => String(result?.fdcId || `${result?.name || "food"}-${index}`);
  const getSafeGrams = (value) => {
    const parsed = Number(value);
    return (!Number.isFinite(parsed) || parsed <= 0) ? 100 : Math.min(2000, Math.round(parsed));
  };
  const scaleNutrientByGrams = (basePer100g, grams) => Math.round(((Number(basePer100g) || 0) * getSafeGrams(grams)) / 100);

  const searchMeals = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) { setError("Please enter a food item"); return; }
    setLoading(true); setError(""); setSearchResults([]);
    try {
      const response = await API.post("/api/nutrition/search", { query: searchQuery });
      if (response.data.results?.length > 0) {
        setSearchResults(response.data.results);
        const initialGrams = {};
        response.data.results.forEach((r, i) => { initialGrams[getResultKey(r, i)] = 100; });
        setGramsByResult(initialGrams);
      } else { setError("No foods found."); }
    } catch (err) { setError("Search failed. Try again."); } finally { setLoading(false); }
  };

  const addMealToToday = async (meal, gramsInput) => {
    if (!token) { navigate("/login"); return; }
    const grams = getSafeGrams(gramsInput);
    try {
      await API.post("/api/meals", {
        name: `${meal.name} (${grams}g)`,
        calories: scaleNutrientByGrams(meal.calories, grams),
        protein: scaleNutrientByGrams(meal.protein, grams),
        carbs: scaleNutrientByGrams(meal.carbs, grams),
        fats: scaleNutrientByGrams(meal.fats, grams),
      }, { headers: { Authorization: `Bearer ${token}` } });
      notify(`${meal.name} added!`, "success");
      setSearchQuery(""); setSearchResults([]); fetchSummaries();
    } catch (e) { notify("Failed to add meal", "error"); }
  };

  const deleteMeal = async (mealId) => {
    if (!token || !window.confirm("Delete this meal?")) return;
    try {
      await API.delete(`/api/meals/${mealId}`, { headers: { Authorization: `Bearer ${token}` } });
      notify("Meal deleted", "success");
      fetchSummaries();
    } catch (e) { notify("Delete failed", "error"); }
  };

  const handleHistoryDateSelect = (dateStr) => {
    setHistoryDate(dateStr);
    setHistoryMeals(allMeals.filter((m) => getMealDate(m) === dateStr));
  };

  // ✅ Crash-proof loop: only runs if allMeals is a valid list
  const mealsByDate = {};
  if (Array.isArray(allMeals)) {
    allMeals.forEach((m) => {
      const mealDate = getMealDate(m);
      if (mealDate) {
        mealsByDate[mealDate] = true;
      }
    });
  }

  return (
    <div className={`nutrition-page ${isInitialLoad ? 'loading' : ''}`}>
      {/* --- REFINED HEADER --- */}
      <header className="nutrition-header">
        <button className="icon-btn-back" onClick={() => navigate("/dashboard")} aria-label="Go back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 className="page-title">Nutrition</h1>
        <div className="header-right">
          <div className="profile-initials-circle" onClick={() => navigate("/settings")}>
            {userInitials}
          </div>
        </div>
      </header>

      <main className="nutrition-content">
        {/* --- MACRO OVERVIEW CARD --- */}
        <section className="stats-hero-section">
          <div className="main-stat-card">
            <span className="stat-label">Daily Calories</span>
            <h2 className="stat-value">{dailySummary.totalCalories} <small>kcal</small></h2>
            <div className="macro-progress-row">
              <div className="macro-pill"><strong>P</strong> {dailySummary.totalProtein}g</div>
              <div className="macro-pill"><strong>C</strong> {dailySummary.totalCarbs}g</div>
              <div className="macro-pill"><strong>F</strong> {dailySummary.totalFats}g</div>
            </div>
          </div>
        </section>

        {/* --- SEARCH COMPONENT --- */}
        <section className="search-container">
          <form onSubmit={searchMeals} className="modern-search-bar">
            <input
              type="text"
              placeholder="Search food database..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" disabled={loading}>
              {loading ? <div className="spinner-small"></div> : "Search"}
            </button>
          </form>

          {error && <div className="error-toast">{error}</div>}

          {searchResults.length > 0 && (
            <div className="results-dropdown">
              <div className="results-header">Results ({searchResults.length})</div>
              <div className="results-scroll">
                {searchResults.map((result, i) => (
                  <div key={i} className="result-item-card">
                    <div className="res-meta">
                      <h4>{result.name}</h4>
                      <p>{result.serving_size || '100g'}</p>
                    </div>
                    <div className="res-actions">
                      <div className="gram-selector">
                        <input
                          type="number"
                          value={gramsByResult[getResultKey(result, i)] ?? 100}
                          onChange={(e) => {
                            const val = e.target.value;
                            setGramsByResult(p => ({ ...p, [getResultKey(result, i)]: val === "" ? "" : getSafeGrams(val) }));
                          }}
                        />
                        <span>g</span>
                      </div>
                      <button className="btn-add-mini" onClick={() => addMealToToday(result, gramsByResult[getResultKey(result, i)] ?? 100)}>
                        Add +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* --- LOGGED MEALS SECTION --- */}
        <section className="meal-log-section">
          <div className="log-header">
            <h3>{historyDate === toLocalISODate() ? "Today's Log" : "Log: " + historyDate}</h3>
            <button className="history-toggle-btn" onClick={() => setShowCalendar(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              History
            </button>
          </div>

          <div className="meal-list-container">
            {(showCalendar ? historyMeals : userMeals).length === 0 ? (
              <div className="empty-state">No entries for this date.</div>
            ) : (
              (showCalendar ? historyMeals : userMeals).map((meal) => (
                <div key={meal.id} className="meal-log-item">
                  <div className="meal-details">
                    <p className="m-name">{meal.name}</p>
                    <p className="m-macros">{meal.calories} kcal • P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fats}g</p>
                  </div>
                  <button className="btn-delete-meal" onClick={() => deleteMeal(meal.id)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {showCalendar && (
          <HistoryCalendarModal 
            isOpen={showCalendar}
            onClose={() => setShowCalendar(false)}
            selectedDate={historyDate}
            onDateSelect={handleHistoryDateSelect}
            hasDataByDate={mealsByDate}
          />
        )}
      </main>
    </div>
  );
}

export default Nutrition;