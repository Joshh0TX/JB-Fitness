import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api.js";
import Logo from "../components/Logo";
import { notify } from "../components/appNotifications";
import "./Badges.css";

function Badges() {
  const navigate = useNavigate();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchBadges();
  }, [navigate]);

  const fetchBadges = async () => {
    try {
      const response = await API.get("/badges");
      setBadges(response.data.badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      notify("Failed to load badges", "error");
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
          Loading badges...
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
            <h1>Badges</h1>
            <p className="badges-subtitle">View completed milestones and earned rewards for your activity.</p>
          </div>
        </div>

        {badges.length === 0 ? (
          <div className="no-badges">
            <p>No badges earned yet.</p>
            <p>Complete workouts, track your steps, and stay consistent to unlock rewards.</p>
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