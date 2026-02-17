import { useState, useEffect } from 'react';
import API from '../api.js';

// Smart hydration alert notification system
function NotificationIcon() {
  const [waterCount, setWaterCount] = useState(0);
  const [showAlert, setShowAlert] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // fetch today's water count from dashboard API
    const fetchWater = async () => {
      try {
        const res = await API.get('/api/dashboard');
        setWaterCount(res.data.water || 0);
        // Auto-show alert if not reached daily goal (8 glasses)
        if ((res.data.water || 0) < 8 && !dismissed) {
          setShowAlert(true);
        }
      } catch (e) {
        console.error('Failed to fetch water count', e);
      }
    };
    fetchWater();

    // Listen for manual increments elsewhere
    const handler = () => fetchWater();
    window.addEventListener('waterUpdated', handler);
    return () => window.removeEventListener('waterUpdated', handler);
  }, [dismissed]);

  const markDrank = async () => {
    try {
      const res = await API.post('/api/metrics/water');
      const newCount = res.data.water ?? (waterCount + 1);
      setWaterCount(newCount);
      // notify dashboard to refresh
      window.dispatchEvent(new CustomEvent('waterUpdated', { detail: { water: newCount } }));
      
      // Keep showing alert if still below goal
      if (newCount >= 8) {
        setShowAlert(false);
      }
    } catch (error) {
      console.error('Failed to log water', error);
    }
  };

  const dismissAlert = () => {
    setShowAlert(false);
    setDismissed(true);
  };

  return (
    <>
      {showAlert && waterCount < 8 && (
        <div className="hydration-alert">
          <div className="alert-content">
            <span className="alert-icon">💧</span>
            <div className="alert-text">
              <strong>Time to hydrate!</strong>
              <p>{waterCount}/8 glasses today</p>
            </div>
            <button className="alert-btn drank" onClick={markDrank}>
              I drank
            </button>
            <button className="alert-btn dismiss" onClick={dismissAlert} aria-label="Dismiss">
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default NotificationIcon;


