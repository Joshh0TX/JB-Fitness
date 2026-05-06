import React from "react";
import "./NutritionCharts.css";

const NutritionCharts = ({ dailySummary, summaryData }) => {
  const dailyCalorieGoal = summaryData?.calories?.goal || 2200;
  const totalCaloriesConsumed = dailySummary.totalCalories || 0;

  const macroData = [
    { key: "protein", label: "Protein", val: dailySummary.totalProtein || 0, goal: 200, color: "#2e7d32" }, // FUTO Green
    { key: "carbs", label: "Carbs", val: dailySummary.totalCarbs || 0, goal: 300, color: "#ffb300" },
    { key: "fats", label: "Fats", val: dailySummary.totalFats || 0, goal: 100, color: "#ff7043" },
  ];

  const totalGrams = macroData.reduce((sum, m) => sum + m.val, 0);
  const calorieProgress = Math.min((totalCaloriesConsumed / dailyCalorieGoal) * 100, 100);

  // --- SVG Donut Logic ---
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.3
  let cumulativeOffset = 0;

  return (
    <section className="nutrition-section">
      <div className="section-header">
        <h2 className="section-title">Nutrition Analysis</h2>
        <span className="text-label">{Math.round(calorieProgress)}% OF GOAL</span>
      </div>

      <div className="nutrition-grid">
        {/* ⭕ SHARP DONUT CARD */}
        <div className="nutrition-main-block">
          <div className="donut-wrapper">
            <svg viewBox="0 0 100 100" className="macro-svg">
              {/* Background Track */}
              <circle className="donut-track" cx="50" cy="50" r={radius} />
              
              {/* Segmented Macro Rings */}
              {macroData.map((macro) => {
                const percentage = totalGrams > 0 ? (macro.val / totalGrams) * 100 : 0;
                const strokeDash = (percentage * circumference) / 100;
                const offset = cumulativeOffset;
                cumulativeOffset += strokeDash;

                return (
                  <circle
                    key={macro.key}
                    className="donut-segment"
                    cx="50" cy="50" r={radius}
                    stroke={macro.color}
                    style={{ 
                      strokeDasharray: `${strokeDash} ${circumference}`,
                      strokeDashoffset: -offset 
                    }}
                  />
                );
              })}
            </svg>
            <div className="donut-center">
              <span className="center-val text-value">{Math.round(totalCaloriesConsumed)}</span>
              <span className="center-label text-label">KCAL</span>
            </div>
          </div>

          <div className="macro-legend-anchored">
            {macroData.map((m) => (
              <div key={m.key} className="legend-item">
                <div className="legend-top">
                  <span className="dot" style={{ background: m.color }} />
                  <span className="legend-name text-label">{m.label}</span>
                </div>
                <span className="legend-val text-value">{m.val}g</span>
              </div>
            ))}
          </div>
        </div>

        {/* 📊 MATURED BAR CHART */}
        <div className="bar-chart-block">
          <div className="chart-header">
            <h4 className="block-sub-title">Daily Thresholds</h4>
          </div>
          <div className="bars-container">
            {macroData.map((m) => {
              const progress = Math.min((m.val / m.goal) * 100, 100);
              return (
                <div key={m.key} className="capsule-bar-row">
                  <div className="bar-info">
                    <span className="bar-label">{m.label}</span>
                    <span className="bar-meta text-value">{m.val} / {m.goal}g</span>
                  </div>
                  <div className="capsule-track">
                    <div 
                      className="capsule-fill" 
                      style={{ width: `${progress}%`, backgroundColor: m.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default NutritionCharts;