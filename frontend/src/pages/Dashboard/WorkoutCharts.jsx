import React from "react";
import "./WorkoutCharts.css";

//added sumn
const WorkoutCharts = ({ weeklyWorkoutSummary }) => {
  const toLocalISODate = (input = new Date()) => {
    const date = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const sevenDaysData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = toLocalISODate(d);
    const existingData = weeklyWorkoutSummary?.find(w => w.day === dayStr);
    sevenDaysData.push(existingData || { day: dayStr, totalCalories: 0, totalWorkouts: 0 });
  }

  const maxCal = Math.max(...sevenDaysData.map((d) => d.totalCalories ?? 0), 100);
  const niceMax = Math.ceil(maxCal / 100) * 100;
  const today = toLocalISODate();
  const weeklyTotalCals = sevenDaysData.reduce((s, d) => s + (d.totalCalories ?? 0), 0);

  return (
    <div className="workout-premium-card">
      <div className="workout-card-header">
        <div className="header-main">
          
          <div className="title-stack">
            <h3 className="card-title">Weekly Burn</h3>
            <span className="card-subtitle">Activity consistency</span>
          </div>
        </div>
        <div className="header-stats">
          <span className="total-val text-value">{weeklyTotalCals.toLocaleString()}</span>
          <span className="total-label">KCAL THIS WEEK</span>
        </div>
      </div>

      <div className="chart-viewport">
        <div className="y-axis-labels">
          <span>{niceMax}</span>
          <span>{niceMax / 2}</span>
          <span>0</span>
        </div>

        <div className="svg-container">
          <svg className="main-svg" viewBox="0 0 700 200" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="0" x2="700" y2="0" className="grid-line" />
            <line x1="0" y1="100" x2="700" y2="100" className="grid-line dashed" />
            <line x1="0" y1="200" x2="700" y2="200" className="grid-line" />

            {sevenDaysData.map((d, i) => {
              const h = (d.totalCalories / niceMax) * 200;
              const w = 44;
              const x = (i * 100) + (100 - w) / 2;
              const y = 200 - h;
              const isToday = d.day === today;

              return (
                <g key={i}>
                  <rect 
                    x={x} y={y} width={w} height={h} rx="8" 
                    className={`bar ${isToday ? "active" : ""}`} 
                  />
                  {d.totalCalories > 0 && (
                    <text x={x + w/2} y={y - 12} className="bar-label text-value">
                      {d.totalCalories}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          
          <div className="x-axis-labels">
            {sevenDaysData.map((d, i) => {
              const date = new Date(d.day + "T12:00:00");
              const label = date.toLocaleDateString("en-US", { weekday: "short" });
              return (
                <div key={i} className={`day-tick ${d.day === today ? "active" : ""}`}>
                  <span className="day-name">{label}</span>
                  <div className={`status-dot ${d.totalWorkouts > 0 ? "has-data" : ""}`} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutCharts;