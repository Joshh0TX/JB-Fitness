import React from "react";
import "./SummaryCards.css";

const SummaryCards = ({ summaryData, dailySummary }) => {
  const calculateProgress = (current, goal) => {
    if (!goal || goal === 0) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const cards = [
    {
      key: "calories",
      title: "Nutrition",
      current: dailySummary.totalCalories || 0,
      goal: summaryData.calories.goal,
      unit: "kcal",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      key: "workouts",
      title: "Training",
      current: summaryData.workouts.current || 0,
      goal: summaryData.workouts.goal,
      unit: "Sessions",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 3h12M6 21h12M12 3v18M7 7h10M7 17h10" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="summary-container">
      {cards.map((card) => {
        const progress = calculateProgress(card.current, card.goal);
        
        return (
          <div key={card.key} className="summary-block">
            <div className="block-header">
              <span className="block-icon">{card.icon}</span>
              <h3 className="block-title">{card.title}</h3>
            </div>
            
            <div className="block-main">
              <div className="value-group">
                <span className="value-large text-value">{card.current.toLocaleString()}</span>
                <span className="value-unit">{card.unit}</span>
              </div>
              
              <div className="goal-info">
                <span className="goal-text">Target: <strong>{card.goal}</strong></span>
              </div>

              <div className="progress-track-mini">
                <div 
                  className="progress-fill-mini" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SummaryCards;