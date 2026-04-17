import { useEffect, useState } from "react";
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchData();
  }, [navigate]);

  const getMonthWeekBounds = (date = new Date()) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Monday of the current week
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(year, month, diff);
    
    // Sunday of the current week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return {
      monday: monday.toISOString().split("T")[0],
      sunday: sunday.toISOString().split("T")[0]
    };
  };

  const calculateMilestones = (workouts, stepsData) => {
    const weekBounds = getMonthWeekBounds();
    
    // Calculate total steps for the week
    const totalSteps = stepsData.steps || 0;
    const stepsProgress = Math.min((totalSteps / 120000) * 100, 100);
    
    // Calculate strength training progress (sum of all reps from workouts)
    let totalReps = 0;
    let strengthWorkoutDays = new Set();
    
    if (Array.isArray(workouts)) {
      workouts.forEach(workout => {
        const workoutTitle = (workout.title || "").toLowerCase();
        // Exclude cardio/walking activities
        const isCardio = ["walk", "run", "jog", "hike", "treadmill", "cycling", "swim", "cardio"].some(
          keyword => workoutTitle.includes(keyword)
        );
        
        if (!isCardio && workout.reps) {
          totalReps += parseInt(workout.reps) || 0;
          const workoutDate = workout.date ? workout.date.split("T")[0] : new Date().toISOString().split("T")[0];
          strengthWorkoutDays.add(workoutDate);
        }
      });
    }
    
    const strengthProgress = Math.min((totalReps / 500) * 100, 100);
    const workoutDaysCompleted = strengthWorkoutDays.size;
    
    // Calculate cardio progress (excluding walking, including all other cardio)
    let totalCardioDistance = 0;
    workouts?.forEach(workout => {
      const title = (workout.title || "").toLowerCase();
      const isCardioDistance = ["running", "cycling", "swimming"].some(kw => title.includes(kw));
      if (isCardioDistance && workout.distance) {
        totalCardioDistance += parseFloat(workout.distance) || 0;
      }
    });
    
    const cardioProgress = Math.min((totalCardioDistance / 25) * 100, 100); // 25km cardio milestone
    
    // Calculate consistency (days worked out this week)
    const weekStart = new Date(weekBounds.monday);
    const consistencyDays = workouts?.filter(w => {
      const wDate = new Date(w.date || new Date());
      return wDate >= weekStart;
    }).length || 0;
    const consistencyProgress = Math.min((consistencyDays / 7) * 100, 100);
    
    return [
      {
        id: "steps",
        name: "Step Master",
        description: "Walk 120,000 steps in a week",
        current: totalSteps,
        goal: 120000,
        progress: stepsProgress,
        unit: "steps",
        icon: "S",
        color: "#4CAF50",
        milestone: 120000
      },
      {
        id: "strength",
        name: "Iron Grinder",
        description: "Complete 500 total reps in strength training",
        current: totalReps,
        goal: 500,
        progress: strengthProgress,
        unit: "reps",
        icon: "I",
        color: "#FF6B6B",
        milestone: 500
      },
      {
        id: "cardio",
        name: "Cardio Conqueror",
        description: "Complete 25km of running, cycling, or swimming",
        current: totalCardioDistance,
        goal: 25,
        progress: cardioProgress,
        unit: "km",
        icon: "C",
        color: "#FFB84D",
        milestone: 25
      },
      {
        id: "consistency",
        name: "Consistency Champion",
        description: "Work out 7 days in a week",
        current: consistencyDays,
        goal: 7,
        progress: consistencyProgress,
        unit: "days",
        icon: "X",
        color: "#9C27B0",
        milestone: 7
      }
    ];
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch badges
      const badgesRes = await API.get("/api/badges", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBadges(badgesRes.data.badges || []);
      
      // Fetch workouts
      const workoutsRes = await API.get("/api/workouts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch activity summary (steps)
      const stepsRes = await API.get("/api/workouts/activity-summary", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Calculate milestones
      const calculatedMilestones = calculateMilestones(workoutsRes.data || [], stepsRes.data || {});
      setMilestones(calculatedMilestones);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      notify("Failed to load badges and progress", "error");
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "common": return "#8B8B8B";
      case "rare": return "#4A90E2";
      case "epic": return "#9B59B6";
      case "legendary": return "#F39C12";
      default: return "#8B8B8B";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatProgress = (current, goal, unit) => {
    if (unit === "km") return `${current.toFixed(1)} / ${goal}${unit}`;
    return `${Math.floor(current).toLocaleString()} / ${goal.toLocaleString()}${unit}`;
  };

  if (loading) {
    return (
      <div className="badges-page page-animate">
        <div className="badges-header">
          <button className="back-button" onClick={() => navigate("/dashboard")}>
            Back
          </button>
          <Logo />
          <div />
        </div>

        <div className="badges-loading">
          Loading your progress and badges...
        </div>
      </div>
    );
  }

  return (
    <div className="badges-page page-animate">
      <div className="badges-header">
        <button className="back-button" onClick={() => navigate("/dashboard")}>Back</button>
        <Logo />
        <div />
      </div>

      <div className="badges-container">
        <div className="badges-title-row">
          <div>
            <h1>Achievements</h1>
            <p className="badges-subtitle">Track your progress toward fitness milestones and earn badges for your dedication.</p>
          </div>
        </div>

        {/* Progress Milestones Section */}
        <div className="milestones-section">
          <h2 className="section-title">Weekly Progress</h2>
          <div className="milestones-grid">
            {milestones.map((milestone) => (
              <div key={milestone.id} className="milestone-card" style={{ borderLeftColor: milestone.color }}>
                <div className="milestone-header">
                  <span className="milestone-icon">{milestone.icon}</span>
                  <h3 className="milestone-name">{milestone.name}</h3>
                </div>
                
                <p className="milestone-description">{milestone.description}</p>
                
                <div className="milestone-stats">
                  <span className="milestone-progress-text">
                    {formatProgress(milestone.current, milestone.goal, milestone.unit)}
                  </span>
                  <span className="milestone-percentage">{Math.floor(milestone.progress)}%</span>
                </div>
                
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ 
                      width: `${milestone.progress}%`,
                      backgroundColor: milestone.color
                    }}
                  />
                </div>
                
                <div className="milestone-footer">
                  {milestone.progress >= 100 ? (
                    <span className="milestone-completed">✓ Completed!</span>
                  ) : (
                    <span className="milestone-remaining">
                      {milestone.goal - Math.floor(milestone.current)} {milestone.unit} to go
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Earned Badges Section */}
        <div className="badges-section">
          <h2 className="section-title">Earned Badges</h2>
          {badges.length === 0 ? (
            <div className="no-badges">
              <p>No badges earned yet.</p>
              <p>Complete your milestones above to unlock exclusive badges!</p>
            </div>
          ) : (
            <div className="badges-grid">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="badge-card"
                  style={{ borderColor: getRarityColor(badge.rarity) }}
                >
                  <div className="badge-card-icon" />
                  <div className="badge-info">
                    <div className="badge-card-meta">
                      <span className={`badge-chip badge-chip--${badge.rarity}`}>{badge.rarity}</span>
                      <span className="badge-points">+{badge.points} pts</span>
                    </div>
                    <h3>{badge.name}</h3>
                    <p className="badge-description">{badge.description}</p>
                    <div className="earned-date">Earned {formatDate(badge.earned_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Badges;
