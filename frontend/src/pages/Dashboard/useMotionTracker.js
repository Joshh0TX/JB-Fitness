import { useState, useEffect, useRef } from "react";
import API from "../../api";

const getTodayKey = () => new Date().toISOString().split("T")[0];

export default function useMotionTracker() {
  const [displaySteps, setDisplaySteps] = useState(0);
  const [motionTrackingEnabled, setMotionTrackingEnabled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const sessionStepsRef = useRef(0);

  useEffect(() => {
    setIsSupported("DeviceMotionEvent" in window);
  }, []);

  // Save to DB every 5 minutes silently
  useEffect(() => {
    if (!motionTrackingEnabled) return;

    const interval = setInterval(async () => {
      if (sessionStepsRef.current === 0) return;
      try {
        await API.post("/api/steps/log", {
          steps: sessionStepsRef.current,
          date: getTodayKey(),
        });
        setDisplaySteps(sessionStepsRef.current);
      } catch (err) {
        console.error("Failed to sync steps:", err);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [motionTrackingEnabled]);

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