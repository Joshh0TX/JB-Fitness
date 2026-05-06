import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api.js";
import Logo from "../components/Logo";
import { notify } from "../components/appNotifications";
import "./Badges.css";

function Badges() {
  const navigate = useNavigate();
  const [badges, setBadges] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInitials, setUserInitials] = useState("JD");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const name = user.username || user.name || "User";
      setUserInitials(name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2));
    }

    fetchData();
  }, [navigate]);

  const getMonthWeekBounds = () => {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const calculateMilestones = (workouts, stepsData) => {
    // SAFETY: Ensure workouts is an array to prevent crash
    const safeWorkouts = Array.isArray(workouts) ? workouts : [];
    const monday = getMonthWeekBounds();
    
    const totalSteps = stepsData.steps || 0;
    
    let totalReps = 0;
    let totalCardioDistance = 0;
    let strengthDays = new Set();
    let consistencyCount = 0;

    safeWorkouts.forEach(w => {
      const wDate = new Date(w.date || w.created_at || new Date());
      const title = (w.title || "").toLowerCase();
      
      // Filter for this week only
      if (wDate >= monday) {
        consistencyCount++;
        const isCardio = ["walk", "run", "jog", "cycling", "swim"].some(k => title.includes(k));
        
        if (!isCardio && w.reps) {
          totalReps += parseInt(w.reps) || 0;
          strengthDays.add(wDate.toISOString().split('T')[0]);
        }
        
        const isDistanceCardio = ["running", "cycling", "swimming"].some(k => title.includes(k));
        if (isDistanceCardio && w.distance) {
          totalCardioDistance += parseFloat(w.distance) || 0;
        }
      }
    });

    return [
      {
        id: "steps",
        name: "Step Master",
        desc: "Walk 120,000 steps this week",
        current: totalSteps,
        goal: 120000,
        unit: "steps",
        color: "#4CAF50",
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 4v16M17 4v16M9 4v16M5 4v16" strokeLinecap="round"/></svg>
      },
      {
        id: "strength",
        name: "Iron Grinder",
        desc: "500 reps of strength training",
        current: totalReps,
        goal: 500,
        unit: "reps",
        color: "#FF6B6B",
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 7h12M6 17h12M2 12h20" strokeLinecap="round"/></svg>
      },
      {
        id: "cardio",
        name: "Cardio Conqueror",
        desc: "25km of cardio activities",
        current: totalCardioDistance,
        goal: 25,
        unit: "km",
        color: "#FFB84D",
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      },
      {
        id: "consistency",
        name: "7-Day Streak",
        desc: "Work out every day this week",
        current: consistencyCount,
        goal: 7,
        unit: "days",
        color: "#9C27B0",
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
      }
    ];
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [bRes, wRes, sRes] = await Promise.all([
        API.get("/api/badges", { headers: { Authorization: `Bearer ${token}` } }),
        API.get("/api/workouts", { headers: { Authorization: `Bearer ${token}` } }),
        API.get("/api/workouts/activity-summary", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setBadges(Array.isArray(bRes.data.badges) ? bRes.data.badges : []);
      setMilestones(calculateMilestones(wRes.data, sRes.data));
    } catch (error) {
      notify("Failed to load achievements", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ds) => new Date(ds).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="badges-page">
      <header className="badges-header">
        <button className="icon-btn-back" onClick={() => navigate("/dashboard")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 className="page-title">Achievements</h1>
        <div className="header-right">
          <div className="profile-initials-circle" onClick={() => navigate('/settings')}>{userInitials}</div>
        </div>
      </header>

      <main className="badges-content">
        {loading ? (
          <div className="loading-shimmer-achievements">Calculating your glory...</div>
        ) : (
          <>
            {/* --- MILESTONES HERO --- */}
            <section className="milestones-hero">
              <div className="section-intro">
                <h2>Weekly Milestones</h2>
                <p>Complete these targets to unlock new badges.</p>
              </div>
              <div className="milestones-grid">
                {milestones.map((m) => {
                  const percent = Math.min((m.current / m.goal) * 100, 100);
                  return (
                    <div key={m.id} className="m-card" style={{"--m-color": m.color}}>
                      <div className="m-icon-box">{m.icon}</div>
                      <div className="m-info">
                        <h4>{m.name}</h4>
                        <p>{m.desc}</p>
                        <div className="m-progress-container">
                          <div className="m-bar"><div className="m-fill" style={{width: `${percent}%`}}></div></div>
                          <div className="m-labels">
                            <span>{m.current.toLocaleString()} / {m.goal} {m.unit}</span>
                            <span className="m-perc">{Math.floor(percent)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* --- BADGES GRID --- */}
            <section className="badges-collection">
              <h2 className="section-title">Your Collection</h2>
              {badges.length === 0 ? (
                <div className="empty-badges">
                  <div className="lock-icon">🔒</div>
                  <p>Your trophy cabinet is empty. Time to hit the gym!</p>
                </div>
              ) : (
                <div className="badges-grid-premium">
                  {badges.map((badge) => (
                    <div key={badge.id} className={`badge-medal rarity-${badge.rarity}`}>
                      <div className="medal-glow"></div>
                      <div className="medal-content">
                        <div className="medal-icon">🏆</div>
                        <span className="rarity-tag">{badge.rarity}</span>
                        <h3>{badge.name}</h3>
                        <p>{badge.description}</p>
                        <div className="medal-footer">
                           <span>+{badge.points} pts</span>
                           <small>{formatDate(badge.earned_at)}</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default Badges;