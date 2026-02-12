import { useState, useEffect } from 'react';
import API from '../api.js';

// Simple notification bell with water reminders (8 times/day)
function NotificationIcon() {
  const [open, setOpen] = useState(false);
  const [waterCount, setWaterCount] = useState(0);
  const scheduleTimes = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];

  useEffect(() => {
    // fetch today's water count from dashboard API
    const fetch = async () => {
      try {
        const res = await API.get('/api/dashboard');
        setWaterCount(res.data.water || 0);
      } catch (e) {
        // ignore
      }
    };
    fetch();

    // Listen for manual increments elsewhere
    const handler = () => fetch();
    window.addEventListener('waterUpdated', handler);
    return () => window.removeEventListener('waterUpdated', handler);
  }, []);

  const markDrank = async () => {
    try {
      const res = await API.post('/api/metrics/water');
      const newCount = res.data.water ?? (waterCount + 1);
      setWaterCount(newCount);
      // notify dashboard to refresh
      window.dispatchEvent(new CustomEvent('waterUpdated', { detail: { water: newCount } }));
      alert('Nice! Logged one glass of water.');
    } catch (error) {
      console.error('Failed to log water', error);
      alert('Failed to log water.');
    }
  };

  return (
    <div className="notification-root">
      <button className="notification-btn" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
        <svg
          className="notification-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span className="notif-badge">{waterCount}</span>
      </button>

      {open && (
        <div className="notif-popover">
          <h4>Hydration Reminders</h4>
          <p>Aim for 8 glasses per day. Tap "I drank" when you have one.</p>
          <ul className="reminder-list">
            {scheduleTimes.map((t) => (
              <li key={t} className="reminder-item">
                <span className="time">{t}</span>
                <button className="drank-btn" onClick={markDrank}>I drank</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default NotificationIcon;


