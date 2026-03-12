import { useEffect, useMemo, useState } from "react";
import "./AppNotificationCenter.css";

function AppNotificationCenter() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const onNotify = (event) => {
      const detail = event?.detail || {};
      if (!detail.message) return;

      const nextItem = {
        id: detail.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        message: detail.message,
        type: detail.type || "info",
        durationMs: Number(detail.durationMs) || 3200,
      };

      setItems((prev) => [...prev, nextItem]);

      window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== nextItem.id));
      }, nextItem.durationMs);
    };

    window.addEventListener("app-notify", onNotify);
    return () => window.removeEventListener("app-notify", onNotify);
  }, []);

  const hasItems = useMemo(() => items.length > 0, [items]);

  if (!hasItems) return null;

  return (
    <div className="app-notify-viewport" aria-live="polite" aria-atomic="true">
      {items.map((item) => (
        <div key={item.id} className={`app-notify-item ${item.type}`} role="status">
          <span className="app-notify-message">{item.message}</span>
          <button
            type="button"
            className="app-notify-close"
            onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default AppNotificationCenter;
