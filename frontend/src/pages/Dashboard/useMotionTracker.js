import { useState, useEffect, useRef } from "react";
import API from "../../api";

const getTodayKey = () => new Date().toISOString().split("T")[0];
const STORAGE_KEY = `motionSteps_${getTodayKey()}`;

const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : 0;
  } catch { return 0; }
};

const saveToStorage = (steps) => {
  try {
    // Clear previous day's keys
    Object.keys(localStorage)
      .filter(k => k.startsWith("motionSteps_") && k !== STORAGE_KEY)
      .forEach(k => localStorage.removeItem(k));
    localStorage.setItem(STORAGE_KEY, String(steps));
  } catch {}
};

export default function useMotionTracker() {
  const [displaySteps, setDisplaySteps] = useState(() => loadFromStorage());
  const [motionTrackingEnabled, setMotionTrackingEnabled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const sessionStepsRef = useRef(loadFromStorage()); // start from saved value
  const lastSyncedStepsRef = useRef(0);

  useEffect(() => {
    setIsSupported("DeviceMotionEvent" in window);
  }, []);

  // Update display + localStorage every 30 seconds
  useEffect(() => {
    if (!motionTrackingEnabled) return;
    const interval = setInterval(() => {
      const current = sessionStepsRef.current;
      setDisplaySteps(current);
      saveToStorage(current);
    }, 30 * 1000);
    return () => clearInterval(interval);
  }, [motionTrackingEnabled]);

  // Sync to DB every 5 minutes
  useEffect(() => {
    if (!motionTrackingEnabled) return;
    const interval = setInterval(async () => {
      const newSteps = sessionStepsRef.current - lastSyncedStepsRef.current;
      if (newSteps <= 0) return;
      try {
        await API.post("/api/steps/log", {
          steps: sessionStepsRef.current,
          date: getTodayKey(),
        });
        lastSyncedStepsRef.current = sessionStepsRef.current;
      } catch (err) {
        console.error("Failed to sync steps:", err);
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [motionTrackingEnabled]);

  // Sync to DB + localStorage on page hide/close
  useEffect(() => {
    if (!motionTrackingEnabled) return;

    const syncOnExit = async () => {
      const current = sessionStepsRef.current;
      if (current <= 0) return;
      saveToStorage(current);
      try {
        await API.post("/api/steps/log", {
          steps: current,
          date: getTodayKey(),
        });
        lastSyncedStepsRef.current = current;
      } catch (err) {
        console.error("Exit sync failed:", err);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") syncOnExit();
    };

    window.addEventListener("beforeunload", syncOnExit);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", syncOnExit);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [motionTrackingEnabled]);

  // Motion detection
  useEffect(() => {
    if (!motionTrackingEnabled || !isSupported) return;

    let previousMagnitude = null;
    let lastStepTimestamp = 0;

    const onMotion = (event) => {
      const accel = event?.accelerationIncludingGravity;
      if (!accel) return;

      const magnitude = Math.sqrt(
        Math.pow(Number(accel.x ?? 0), 2) +
        Math.pow(Number(accel.y ?? 0), 2) +
        Math.pow(Number(accel.z ?? 0), 2)
      );

      if (previousMagnitude !== null) {
        const delta = magnitude - previousMagnitude;
        const now = Date.now();
        if (delta > 1.15 && now - lastStepTimestamp > 320) {
          lastStepTimestamp = now;
          sessionStepsRef.current += 1;
        }
      }
      previousMagnitude = magnitude;
    };

    window.addEventListener("devicemotion", onMotion, { passive: true });
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [motionTrackingEnabled, isSupported]);

  const enableTracking = async () => {
    if (!isSupported) return;
    const permissionAPI = window.DeviceMotionEvent?.requestPermission;
    if (typeof permissionAPI === "function") {
      try {
        const state = await permissionAPI();
        if (state === "granted") setMotionTrackingEnabled(true);
      } catch (err) {
        console.error(err);
      }
    } else {
      setMotionTrackingEnabled(true);
    }
  };

  return {
    motionSteps: displaySteps,
    motionTrackingEnabled,
    isSupported,
    enableTracking,
  };
}