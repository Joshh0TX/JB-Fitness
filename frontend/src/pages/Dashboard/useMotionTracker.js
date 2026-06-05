import { useState, useEffect, useRef } from "react";
import API from "../../api";

const getTodayKey = () => new Date().toISOString().split("T")[0];
const STORAGE_KEY = `motionSteps_${getTodayKey()}`;
const TRACKING_KEY = "motionTrackingEnabled";

const loadStepsFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : 0;
  } catch { return 0; }
};

const loadTrackingState = () => {
  try {
    return localStorage.getItem(TRACKING_KEY) === "true";
  } catch { return false; }
};

const saveToStorage = (steps) => {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith("motionSteps_") && k !== STORAGE_KEY)
      .forEach(k => localStorage.removeItem(k));
    localStorage.setItem(STORAGE_KEY, String(steps));
  } catch {}
};

const syncToDB = async (steps) => {
  try {
    await API.post("/api/steps/log", { steps, date: getTodayKey() });
    return true;
  } catch (err) {
    console.error("Failed to sync steps:", err);
    return false;
  }
};

export default function useMotionTracker() {
  const [displaySteps, setDisplaySteps] = useState(() => loadStepsFromStorage());
  const [motionTrackingEnabled, setMotionTrackingEnabled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const sessionStepsRef = useRef(loadStepsFromStorage());
  const lastSyncedStepsRef = useRef(0);

  useEffect(() => {
    const supported = "DeviceMotionEvent" in window;
    setIsSupported(supported);

    if (supported && loadTrackingState()) {
      const permissionAPI = window.DeviceMotionEvent?.requestPermission;
      if (typeof permissionAPI === "function") {
        // iOS requires user gesture — clear flag, show button again
        localStorage.removeItem(TRACKING_KEY);
      } else {
        setMotionTrackingEnabled(true);
        // Sync existing localStorage steps to DB on resume
        const existing = loadStepsFromStorage();
        if (existing > 0) syncToDB(existing);
      }
    }
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

  // Sync to DB every 60 seconds
  useEffect(() => {
    if (!motionTrackingEnabled) return;
    const interval = setInterval(async () => {
      const current = sessionStepsRef.current;
      if (current <= lastSyncedStepsRef.current) return;
      const success = await syncToDB(current);
      if (success) lastSyncedStepsRef.current = current;
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [motionTrackingEnabled]);

  // Sync on page hide/close
  useEffect(() => {
    if (!motionTrackingEnabled) return;

    const syncOnExit = () => {
      const current = sessionStepsRef.current;
      if (current <= 0) return;
      saveToStorage(current);
      syncToDB(current);
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
        if (state === "granted") {
          localStorage.setItem(TRACKING_KEY, "true");
          setMotionTrackingEnabled(true);
          const existing = loadStepsFromStorage();
          if (existing > 0) syncToDB(existing);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      localStorage.setItem(TRACKING_KEY, "true");
      setMotionTrackingEnabled(true);
      const existing = loadStepsFromStorage();
      if (existing > 0) syncToDB(existing);
    }
  };

  return {
    motionSteps: displaySteps,
    motionTrackingEnabled,
    isSupported,
    enableTracking,
  };
}