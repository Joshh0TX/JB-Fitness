import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import API from '../api.js';
import NotificationIcon from '../components/NotificationIcon';
import Logo from '../components/Logo';
import './Dashboard.css';


function Dashboard() {
  console.log("Dashboard component mounted");
  const navigate = useNavigate();

  const [summaryData, setSummaryData] = useState({
    calories: { current: 0, goal: 2200, label: 'Cal' },
    workouts: { current: 0, goal: 5, label: 'Workouts' },
    water: { current: 0, goal: 8, label: 'Glasses' },
  });

  const [weeklyData, setWeeklyData] = useState([]);
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [savedMeals, setSavedMeals] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    const fetchDashboardData = async () => {
      try {
        // 1️⃣ Fetch summary + weekly
        const dashRes = await API.get('/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = dashRes.data;

        setSummaryData({
          calories: { current: data.calories, goal: 2200, label: 'Cal' },
          workouts: { current: data.workouts, goal: 5, label: 'Workouts' },
          water: { current: data.water, goal: 8, label: 'Glasses' },
        });

        setWeeklyData(
          data.weeklyProgress.map((cal, index) => ({
            day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][index] || `Day ${index+1}`,
            burned: cal,
            consumed: cal,
          }))
        );

        // 2️⃣ Fetch saved workouts
        const workoutsRes = await API.get('/workouts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSavedWorkouts(workoutsRes.data || []);

        // 3️⃣ Fetch saved meals
        const mealsRes = await API.get('/meals', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSavedMeals(mealsRes.data || []);

      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const calculateProgress = (current, goal) => Math.min((current / goal) * 100, 100);
  const maxCalories = Math.max(...weeklyData.map(d => Math.max(d.burned || 0, d.consumed || 0)), 1);

  return (
    <div className="dashboard page-animate">
      <header className="dashboard-header">
        <div className="header-left"><Logo /></div>
        <div className="header-tabs">
          <button className="tab" onClick={() => navigate('/nutrition')}>Nutrition</button>
          <button className="tab" onClick={() => navigate('/workouts')}>Workout</button>
        </div>
        <div className="header-right">
          <NotificationIcon />
          <div className="profile-icon" onClick={() => navigate('/settings')}><span>JD</span></div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Summary Cards */}
        <div className="summary-cards">
          {['calories','workouts','water'].map((key) => (
            <div key={key} className="summary-card">
              <div className="card-header">
                <h3>{key === 'calories' ? 'Daily Calories' : key === 'workouts' ? 'Workouts This Week' : 'Water Intake'}</h3>
                <span className="card-icon">{summaryData[key].label}</span>
              </div>
              <div className="card-content">
                <div className="card-value">
                  <span className="current">{summaryData[key].current}</span>
                  <span className="goal">of {summaryData[key].goal} {key === 'water' ? 'glasses' : key === 'calories' ? 'goal' : 'planned'}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${calculateProgress(summaryData[key].current, summaryData[key].goal)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Weekly Graph */}
        <div className="weekly-progress">
          <h2 className="section-title">Weekly Progress</h2>
          <div className="graph-container">
            <div className="graph-legend">
              <div className="legend-item"><span className="legend-line burned"></span>Calories Burned</div>
              <div className="legend-item"><span className="legend-line consumed"></span>Calories Consumed</div>
            </div>
            <div className="graph">
              <div className="graph-y-axis">{[0,2000,2500,3000,3500].map(v => <div key={v} className="y-tick">{v}</div>)}</div>
              <div className="graph-content">
                <svg className="graph-svg" viewBox="0 0 700 200" preserveAspectRatio="none">
                  {[0,50,100,150,200].map((y,i) => <line key={i} x1="0" y1={y} x2="700" y2={y} stroke="#f5f5f5" strokeWidth="1" />)}
                  <polyline
                    points={weeklyData.map((d,i) => `${(i*100)+50},${200 - (d.burned/maxCalories)*180}`).join(' ')}
                    fill="none" stroke="#424242" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                  />
                  <polyline
                    points={weeklyData.map((d,i) => `${(i*100)+50},${200 - (d.consumed/maxCalories)*180}`).join(' ')}
                    fill="none" stroke="#bdbdbd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                  />
                </svg>
                <div className="graph-x-axis">{weeklyData.map((d,i) => <div key={i} className="x-tick">{d.day}</div>)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Saved Workouts */}
        <div className="saved-section">
          <div className="section-header"><h2 className="section-title">Saved Workouts</h2><a href="#view-all" className="view-all-link">View all</a></div>
          <div className="workout-cards">
            {savedWorkouts.map((w,i) => (
              <div key={i} className="workout-card">
                <div className="workout-header"><h3>{w.title}</h3><span className="options-icon">⋮</span></div>
                <p className="workout-description">{w.description}</p>
                <div className="workout-stats">
                  <span className="stat"><span className="stat-label">Calories:</span> {w.calories} cal</span>
                  <span className="stat"><span className="stat-label">Duration:</span> {w.duration} min</span>
                </div>
                <button className="workout-btn">Start Workout</button>
              </div>
            ))}
          </div>
        </div>

        {/* Saved Meals */}
        <div className="saved-section">
          <div className="section-header"><h2 className="section-title">Saved Meals</h2><a href="#view-all" className="view-all-link">View all</a></div>
          <div className="meal-cards">
            {savedMeals.map((m,i) => (
              <div key={i} className="meal-card">
                <h3>{m.title}</h3>
                <p className="meal-description">{m.description}</p>
                <div className="meal-stats">
                  <span className="stat"><span className="stat-label">Calories:</span> {m.calories} cal</span>
                  <span className="stat"><span className="stat-label">Protein:</span> {m.protein}g</span>
                  <span className="stat"><span className="stat-label">Carbs:</span> {m.carbs}g</span>
                </div>
                <button className="meal-btn">Add to Today</button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
