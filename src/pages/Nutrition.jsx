import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../api.js";
import Logo from "../components/Logo";
import HistoryCalendarModal from "../components/HistoryCalendarModal";
import "./Nutrition.css";

function Nutrition() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // User initials for avatar
  const [userInitials, setUserInitials] = useState("JD");

  // ✅ States
  const [dailySummary, setDailySummary] = useState({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0,
  });

  const [weeklySummary, setWeeklySummary] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userMeals, setUserMeals] = useState([]);
  
  // Calendar history states
  const [showCalendar, setShowCalendar] = useState(false);
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [allMeals, setAllMeals] = useState([]); // All meals for history
  const [historyMeals, setHistoryMeals] = useState([]); // Meals for selected date

  // ✅ Get user initials on mount
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        const username = user.username || user.name || "User"
        const initials = username
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
        setUserInitials(initials || "JD")
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage:", error)
    }
  }, [])

  // ✅ Fetch initial daily & weekly summaries & user meals
  const fetchSummaries = async () => {
    if (!token) return;

    try {
      const [dailyRes, weeklyRes, mealsRes] = await Promise.all([
        API.get("/api/meals/daily-summary", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        API.get("/api/meals/weekly-summary", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        API.get("/api/meals", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const mealsData = mealsRes.data || [];
      setDailySummary(dailyRes.data);
      setWeeklySummary(weeklyRes.data);
      setAllMeals(mealsData); // Store all meals for history
      
      // Filter meals for today
      const todayStr = new Date().toISOString().split('T')[0];
      const todayMeals = mealsData.filter(m => {
        const mealDate = m.created_at ? m.created_at.split('T')[0] : todayStr;
        return mealDate === todayStr;
      });
      setUserMeals(todayMeals);
    } catch (error) {
      console.error("Summary fetch error:", error);
      setError("Failed to load nutrition data");
    }
  };

  useEffect(() => {
    fetchSummaries();
  }, []);

  // ✅ Search for meals via Nutritionix API
  const searchMeals = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError("Please enter a food item");
      return;
    }

    setLoading(true);
    setError("");
    setSearchResults([]);

    try {
      const response = await API.post("/api/nutrition/search", {
        query: searchQuery,
      });

      if (response.data.results && response.data.results.length > 0) {
        setSearchResults(response.data.results);
      } else {
        setError("No foods found. Try a different search.");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to search for meals. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Add meal from search results to today
  const addMealToToday = async (meal) => {
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/api/login");
      return;
    }

    try {
      await API.post(
        "/api/meals",
        {
          name: meal.name,
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

      alert(`✅ ${meal.name} added to today!`);

      // 🔄 Refresh all data
      setSearchQuery("");
      setSearchResults([]);
      fetchSummaries();
    } catch (error) {
      console.error("Add meal error:", error);
      alert(error.response?.data?.message || "Failed to add meal");
    }
  };

  // ✅ Delete a meal
  const deleteMeal = async (mealId) => {
    if (!token) return;

    if (!window.confirm("Are you sure you want to delete this meal?")) return;

    try {
      await API.delete(`/api/meals/${mealId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Meal deleted");
      fetchSummaries();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete meal");
    }
  };

  // ✅ Handle history date selection from calendar
  const handleHistoryDateSelect = (dateStr) => {
    setHistoryDate(dateStr);
    const mealsThatDay = allMeals.filter(m => {
      const mealDate = m.created_at ? m.created_at.split('T')[0] : null;
      return mealDate === dateStr;
    });
    setHistoryMeals(mealsThatDay);
  };

  // Build object showing which dates have meal data
  const mealsByDate = {};
  allMeals.forEach(m => {
    const mealDate = m.created_at ? m.created_at.split('T')[0] : null;
    if (mealDate) {
      mealsByDate[mealDate] = true;
    }
  });

  return (
    <div className="nutrition-page">
      <header className="nutrition-header">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          ←
        </button>
        <h1>Nutrition</h1>
        <div className="header-right">
          <div className="profile-icon" onClick={() => navigate("/settings")}>
            <span>{userInitials}</span>
          </div>
        </div>
      </header>

      <main className="nutrition-main">
        {/* Daily Summary */}
        <section className="daily-summary-section">
          <h2>Today's Summary</h2>
          <div className="summary-grid">
            <div className="summary-card">
              <p className="label">Calories</p>
              <p className="value">{dailySummary.totalCalories}</p>
            </div>
            <div className="summary-card">
              <p className="label">Protein</p>
              <p className="value">{dailySummary.totalProtein}g</p>
            </div>
            <div className="summary-card">
              <p className="label">Carbs</p>
              <p className="value">{dailySummary.totalCarbs}g</p>
            </div>
            <div className="summary-card">
              <p className="label">Fats</p>
              <p className="value">{dailySummary.totalFats}g</p>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="search-section">
          <h2>Add Meal</h2>
          <form onSubmit={searchMeals} className="search-form">
            <input
              type="text"
              placeholder="Search for a food (e.g., chicken breast, oatmeal, apple)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </form>

          {error && <p className="error-message">{error}</p>}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="search-results">
              <h3>Found {searchResults.length} result(s)</h3>
              <div className="results-grid">
                {searchResults.map((result, index) => (
                  <div key={index} className="result-card">
                    <h4>{result.name}</h4>
                    <p className="serving">
                      {result.serving_qty} {result.serving_unit}
                    </p>

                    <div className="nutrition-info">
                      <span className="nutrition-item">
                        <strong>{result.calories}</strong> cal
                      </span>
                      <span className="nutrition-item">
                        <strong>{result.protein}g</strong> protein
                      </span>
                      <span className="nutrition-item">
                        <strong>{result.carbs}g</strong> carbs
                      </span>
                      <span className="nutrition-item">
                        <strong>{result.fats}g</strong> fats
                      </span>
                    </div>

                    <button
                      className="add-result-btn"
                      onClick={() => addMealToToday(result)}
                    >
                      Add to Today
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Today's Meals / History */}
        <section className="todays-meals-section">
          <div className="meals-section-header">
            <h2>{historyDate === new Date().toISOString().split('T')[0] ? "Today's Meals" : "Meals on " + new Date(historyDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ({showCalendar ? historyMeals.length : userMeals.length})</h2>
            <button 
              className={`history-btn ${showCalendar ? 'active' : ''}`} 
              onClick={() => setShowCalendar(!showCalendar)}
              title="View meal history"
            >
              📅 History
            </button>
          </div>

          {showCalendar && (
            <HistoryCalendarModal 
              isOpen={showCalendar}
              onClose={() => setShowCalendar(false)}
              selectedDate={historyDate}
              onDateSelect={handleHistoryDateSelect}
              hasDataByDate={mealsByDate}
            />
          )}

          {/* Display either today's meals or history meals */}
          {(showCalendar ? historyMeals.length === 0 : userMeals.length === 0) ? (
            <p className="no-meals">No meals added yet. Search above to add!</p>
          ) : (
            <div className="meals-list">
              {(showCalendar ? historyMeals : userMeals).map((meal) => (
                <div key={meal.id} className="meal-item">
                  <div className="meal-info">
                    <h4>{meal.name}</h4>
                    <div className="meal-macros">
                      <span>{meal.calories} cal</span>
                      <span>{meal.protein}g protein</span>
                      <span>{meal.carbs}g carbs</span>
                      <span>{meal.fats}g fats</span>
                    </div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => deleteMeal(meal.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Nutrition;
