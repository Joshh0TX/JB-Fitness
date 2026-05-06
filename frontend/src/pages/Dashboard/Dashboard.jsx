import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../../components/Logo";


// Custom Hooks
import useDashboardData from "./useDashboardData";
import useMotionTracker from "./useMotionTracker";

// Sub-Components
import BadgeAlerts from "./BadgeAlerts";
import ActivityTracker from "./ActivityTracker";
import SummaryCards from "./SummaryCards";
import NutritionCharts from "./NutritionCharts";
import WorkoutCharts from "./WorkoutCharts";
import FoodScannerModal from "./FoodScannerModal";

import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [userInitials] = useState("JD");

  // Logic Layers - Data Engines
  const { 
    summaryData, 
    dailySummary, 
    weeklyWorkoutSummary, 
    walkingSummary, 
    newBadges, 
    fetchDashboardData 
  } = useDashboardData();

  const { 
    motionSteps, 
    motionTrackingEnabled, 
    isSupported, 
    enableTracking 
  } = useMotionTracker();

 
  return (
    <div className="dashboard">
      {/* --- PREMIUM STICKY HEADER --- */}
      <header className="dashboard-header">
        {/* TOP ROW: Logo and Profile Icon */}
        <div className="header-identity-row">
          <div className="header-left">
            <Logo />
          </div>
          <div className="header-right">
            <div className="profile-icon" onClick={() => navigate("/settings")} role="button" tabIndex="0" aria-label="Profile">
              <span>{userInitials}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main  page-animate">
        
        {/* GROUP 1: URGENT / LIVE STATS (The "Mobile Hero" Section) */}
        <section className="dashboard-hero-section">
          <BadgeAlerts badges={newBadges} />
          
          <ActivityTracker 
            walkingSummary={walkingSummary} 
            motionSteps={motionSteps}
            motionTrackingEnabled={motionTrackingEnabled}
            motionTrackingSupported={isSupported}
            enableMotionTracking={enableTracking}
          />

          <SummaryCards 
            summaryData={summaryData} 
            dailySummary={dailySummary} 
          />
        </section>

        {/* GROUP 2: DATA INSIGHTS (The "Presentation" Section for Laptops) */}
        <section className="dashboard-insights-section">
          
            <NutritionCharts 
              dailySummary={dailySummary} 
              summaryData={summaryData} 
            />
          
          
          
          
            <WorkoutCharts 
              weeklyWorkoutSummary={weeklyWorkoutSummary} 
            />
         
         
        </section>

        {/* --- FLOATING ACTION BUTTON --- */}
        {/* Positioned for thumb-reach on mobile */}
        {/* --- PREMIUM AI SCANNER FAB --- */}

      </main>
      <button 
        className="camera-fab" 
        onClick={() => setScannerOpen(true)}
        aria-label="Scan meal with AI"
      >
        <div className="fab-content">
          <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="fab-label">AI SCAN</span>
        </div>
        <div className="fab-glow"></div>
      </button>
      
        {/* --- OVERLAY MODALS --- */}
        {scannerOpen && (
          <FoodScannerModal 
            onClose={() => setScannerOpen(false)} 
            refreshData={fetchDashboardData} 
          />
        )}
    </div>
  );
}

export default Dashboard;