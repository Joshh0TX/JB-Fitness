import React from "react";
import "./BadgeAlerts.css";

const BadgeAlerts = ({ badges }) => {
  // If no new badges, don't render anything
  if (!badges || badges.length === 0) return null;

  return (
    <section className="new-badges-alert">
      <div className="badge-alert-header">
        <h2>🏅 New achievements unlocked</h2>
        <span className="badge-count-pill">{badges.length}</span>
      </div>
      
      <div className="badge-alert-list">
        {badges.map((badge) => (
          <div key={badge.id} className="badge-alert-item">
            <div className="badge-alert-icon-wrap">
               <span className="badge-alert-icon">{badge.icon}</span>
               <div className="badge-icon-glow"></div>
            </div>
            <div className="badge-alert-content">
              <p className="badge-alert-title">{badge.name}</p>
              <p className="badge-alert-text">{badge.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BadgeAlerts;