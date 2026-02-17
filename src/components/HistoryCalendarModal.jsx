import { useState, useEffect } from 'react';
import './HistoryCalendarModal.css';

function HistoryCalendarModal({ isOpen, onClose, selectedDate, onDateSelect, hasDataByDate = {} }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  if (!isOpen) return null;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Create calendar grid
  const calendarDays = [];

  // Previous month's days (grayed out)
  for (let i = daysInPrevMonth - firstDay + 1; i <= daysInPrevMonth; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, i)
    });
  }

  // Current month's days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i)
    });
  }

  // Next month's days (grayed out)
  const remainingDays = 42 - calendarDays.length; // 6 rows * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i)
    });
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1));
  };

  const handleDateClick = (dateObj) => {
    if (!dateObj.isCurrentMonth) return;
    const dateStr = dateObj.date.toISOString().split('T')[0];
    onDateSelect(dateStr);
  };

  const formatMonthYear = () => {
    return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar-modal-overlay" onClick={onClose}>
      <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
        <div className="calendar-header">
          <h2>Select Date</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="calendar-container">
          <div className="month-navigation">
            <button className="nav-btn" onClick={handlePrevMonth}>←</button>
            <h3>{formatMonthYear()}</h3>
            <button className="nav-btn" onClick={handleNextMonth}>→</button>
          </div>

          <div className="calendar-grid">
            {/* Day headers */}
            {dayNames.map((day) => (
              <div key={day} className="day-header">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((dayObj, idx) => {
              const dateStr = dayObj.date.toISOString().split('T')[0];
              const isSelected = selectedDate === dateStr;
              const hasData = hasDataByDate[dateStr];
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={idx}
                  className={`calendar-day ${!dayObj.isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${hasData ? 'has-data' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => handleDateClick(dayObj)}
                >
                  <span className="day-number">{dayObj.day}</span>
                  {hasData && <span className="data-indicator">•</span>}
                </div>
              );
            })}
          </div>

          <div className="calendar-footer">
            <button className="confirm-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistoryCalendarModal;
