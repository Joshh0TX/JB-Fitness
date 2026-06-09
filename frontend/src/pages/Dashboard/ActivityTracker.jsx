import React from "react";
import "./ActivityTracker.css";

const ActivityTracker = ({
  walkingSummary = {},
  motionSteps = 0,
  motionTrackingEnabled = false,
  motionTrackingSupported = false,
  enableMotionTracking = () => {},
}) => {
  const roundedSteps = Math.max(0, Math.round(motionSteps));
  const goalSteps = 10000;
  const progress = Math.min(roundedSteps / goalSteps, 1);
  const distance = walkingSummary.distanceKm ?? 0;
  const calories = walkingSummary.caloriesBurned ?? 0;
  const minutes = walkingSummary.minutesWalked ?? 0;

  return (
    <section className="activity-tracker-clean">
      <div className="activity-header">
        <div>
          <h2 className="activity-title">Activity Tracker</h2>
          <p className="count-label">
            {motionTrackingSupported
              ? "Live step tracking is available"
              : "Motion sensors are not supported on this device"}
          </p>
        </div>
        <span className={`status-pill ${motionTrackingEnabled ? "is-live" : ""}`}>
          {motionTrackingEnabled ? "Live" : "Paused"}
        </span>
      </div>

      <div className="activity-visual-center">
        <div className="rings-wrapper">
          <svg className="activity-svg" viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="52" className="ring-track" />
            <circle
              cx="60"
              cy="60"
              r="52"
              className="ring-bar ring-steps"
              strokeDasharray={`${Math.PI * 2 * 52 * progress} ${Math.PI * 2 * 52}`}
              strokeDashoffset="0"
            />
          </svg>
          <div className="rings-inner-text">
            <p className="main-count">{roundedSteps.toLocaleString()}</p>
            <p className="count-label">steps today</p>
          </div>
        </div>

        <div className="stats-minimal-grid">
          <div className="stat-node">
            <div className="node-data">
              <span className="node-val">{distance.toFixed(1)}</span>
              <span className="node-unit">km</span>
            </div>
            <span className="node-unit">Distance</span>
          </div>
          <div className="stat-node">
            <div className="node-data">
              <span className="node-val">{calories}</span>
              <span className="node-unit">kcal</span>
            </div>
            <span className="node-unit">Burned</span>
          </div>
          <div className="stat-node">
            <div className="node-data">
              <span className="node-val">{minutes}</span>
              <span className="node-unit">min</span>
            </div>
            <span className="node-unit">Active</span>
          </div>
        </div>

        <div className="activity-actions">
          {motionTrackingSupported ? (
            <button
              type="button"
              className={`live-sensor-btn ${motionTrackingEnabled ? "enabled" : ""}`}
              onClick={enableMotionTracking}
            >
              {motionTrackingEnabled ? "Motion tracking active" : "Enable motion tracking"}
            </button>
          ) : (
            <span className="fit-badge">Motion tracking unavailable</span>
          )}
        </div>
      </div>
    </section>
  );
};

export default ActivityTracker;
