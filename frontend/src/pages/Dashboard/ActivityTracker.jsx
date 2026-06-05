import React from "react";
import { useGoogleFitSteps } from "../../hooks/useGoogleFitSteps";
import "./ActivityTracker.css";

const ActivityTracker = ({ 
  walkingSummary, 
  motionSteps, 
  motionTrackingEnabled, 
  motionTrackingSupported, 
  enableMotionTracking 
}) => {
  const googleFit = useGoogleFitSteps();

  // 🔹 Goals & Thresholds
  const stepGoal = 10000;
  const calorieGoal = 500;
  const distanceGoal = 8;
  const minutesGoal = 60;

  // 🔹 Calculation Logic
  const fitSteps = googleFit.connected ? googleFit.steps : 0;
  const sessionSteps = googleFit.connected ? 0 : motionSteps;
  const mergedSteps = googleFit.connected 
  ? fitSteps 
  : motionTrackingEnabled 
    ? motionSteps  // motionSteps already includes DB steps
    : (walkingSummary?.steps || 0); // fallback when tracking is off
  const mergedDistanceKm = mergedSteps / 1312;
  const mergedMinutesWalked = googleFit.connected ? mergedSteps / 105 : (walkingSummary?.minutesWalked || 0) + sessionSteps / 105;
  const mergedCaloriesBurned = googleFit.connected ? mergedSteps * 0.04 : (walkingSummary?.caloriesBurned || 0) + sessionSteps * 0.04;

  const calculateProgress = (current, goal) => Math.min((current / goal) * 100, 100);
  
  // 🔹 SVG Ring Math (Circumference = 2 * PI * r)
  const stepProgress = calculateProgress(mergedSteps, stepGoal);
  const distanceProgress = calculateProgress(mergedDistanceKm, distanceGoal);

  // Outer circle radius 45 -> Circumference ~282
  const strokeDashSteps = (stepProgress * 282.7) / 100;
  // Inner circle radius 36 -> Circumference ~226
  const strokeDashDist = (distanceProgress * 226.2) / 100;

  return (
    <section className="activity-tracker-clean">
      <div className="activity-header">
        <h2 className="activity-title">Daily Activity</h2>
        <div className={`status-pill ${motionTrackingEnabled ? "is-live" : ""}`}>
          {motionTrackingEnabled ? "Live Tracking" : "Synced"}
        </div>
      </div>

      <div className="activity-visual-center">
        {/* SHARP SVG DOUBLE RINGS */}
        <div className="rings-wrapper">
          <svg viewBox="0 0 100 100" className="activity-svg">
            {/* Outer Track & Bar (Steps) */}
            <circle className="ring-track" cx="50" cy="50" r="45" />
            <circle 
              className="ring-bar ring-steps" 
              cx="50" cy="50" r="45" 
              style={{ strokeDasharray: `${strokeDashSteps} 282.7` }}
            />
            
            {/* Inner Track & Bar (Distance) */}
            <circle className="ring-track" cx="50" cy="50" r="36" />
            <circle 
              className="ring-bar ring-dist" 
              cx="50" cy="50" r="36" 
              style={{ strokeDasharray: `${strokeDashDist} 226.2` }}
            />
          </svg>
          
          <div className="rings-inner-text">
            <span className="main-count">{Math.round(mergedSteps).toLocaleString()}</span>
            <span className="count-label">STEPS</span>
          </div>
        </div>

        {/* MINIMALIST STATS GRID (No borders, matured typography) */}
        <div className="stats-minimal-grid">
          <div className="stat-node">
            <svg className="node-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="node-data">
              <span className="node-val">{Math.round(mergedCaloriesBurned)}</span>
              <span className="node-unit">kcal</span>
            </div>
          </div>

          <div className="stat-node">
            <svg className="node-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="10" r="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="node-data">
              <span className="node-val">{mergedDistanceKm.toFixed(1)}</span>
              <span className="node-unit">km</span>
            </div>
          </div>

          <div className="stat-node">
            <svg className="node-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="node-data">
              <span className="node-val">{Math.round(mergedMinutesWalked)}</span>
              <span className="node-unit">min</span>
            </div>
          </div>
        </div>
      </div>

      <div className="activity-actions">
        {googleFit.isAvailable && (
          <div className="sync-section">
            {googleFit.connected ? (
              <div className="fit-badge">
                <img src="https://www.gstatic.com/images/branding/product/1x/gfit_512dp.png" alt="" />
                <span>Google Fit Active</span>
                <button onClick={googleFit.manualSync} className="sync-icon-btn">↺</button>
              </div>
            ) : (
              <button className="connect-link-btn" onClick={googleFit.connect}>
                Connect Google Fit
              </button>
            )}
          </div>
        )}

        {!googleFit.connected && motionTrackingSupported && !motionTrackingEnabled && (
          <button className="live-sensor-btn" onClick={enableMotionTracking}>
            Start Session Tracking
          </button>
        )}
      </div>
    </section>
  );
};

export default ActivityTracker;