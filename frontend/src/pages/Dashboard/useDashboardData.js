import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api.js";
import { notify } from "../../components/appNotifications.js";

// --- Utilities (Kept inside hook or moved to utils.js) ---
export const toLocalISODate = (input = new Date()) => {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const normalizeDay = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return toLocalISODate(value);
};

export default function useDashboardData() {
  const navigate = useNavigate();
  const [newBadges, setNewBadges] = useState([]);
  const [summaryData, setSummaryData] = useState({
    calories: { current: 0, goal: 2200, label: "Cal" },
    workouts: { current: 0, goal: 7, label: "Workouts" },
  });
  const [dailySummary, setDailySummary] = useState({
    totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0,
  });
  const [weeklyWorkoutSummary, setWeeklyWorkoutSummary] = useState([]);
  const [walkingSummary, setWalkingSummary] = useState({
    steps: 0, caloriesBurned: 0, distanceKm: 0, minutesWalked: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    try {
      // 1. Dashboard & Badges
      const dashRes = await API.get("/api/dashboard", { headers: { Authorization: `Bearer ${token}` } });
      const dashData = dashRes.data ?? { workouts: 0, newBadges: [] };
      
      if (dashData.newBadges?.length > 0) {
        setNewBadges(dashData.newBadges);
        dashData.newBadges.forEach(badge => notify(`New badge earned: ${badge.name}`, "success"));
      }
      setSummaryData(prev => ({ ...prev, workouts: { ...prev.workouts, current: dashData.workouts ?? 0 } }));

      // 2. Daily Nutrition
      const dailyRes = await API.get("/api/meals/daily-summary", { headers: { Authorization: `Bearer ${token}` } });
      const dData = dailyRes?.data ?? {};
      setDailySummary({
        totalCalories: Number(dData.totalCalories ?? 0),
        totalProtein: Number(dData.totalProtein ?? 0),
        totalCarbs: Number(dData.totalCarbs ?? 0),
        totalFats: Number(dData.totalFats ?? 0),
      });
      setSummaryData(prev => ({ ...prev, calories: { ...prev.calories, current: Number(dData.totalCalories ?? 0) } }));

      // 3. Weekly Workouts
      const weeklyWorkoutRes = await API.get("/api/workouts/weekly-summary", { headers: { Authorization: `Bearer ${token}` } });
      const rawWeekly = Array.isArray(weeklyWorkoutRes.data) ? weeklyWorkoutRes.data : [];
      setWeeklyWorkoutSummary(rawWeekly.map((d) => ({
        day: normalizeDay(d?.day) || toLocalISODate(),
        totalCalories: Number(d.totalCalories ?? 0),
        totalWorkouts: Number(d.totalWorkouts ?? 0),
      })));

      // 4. Today's Steps
const stepsRes = await API.get("/api/steps/today", { headers: { Authorization: `Bearer ${token}` } });
setWalkingSummary({
  steps: Number(stepsRes?.data?.steps ?? 0),
  caloriesBurned: Math.round(Number(stepsRes?.data?.steps ?? 0) * 0.04),
  distanceKm: Number((Number(stepsRes?.data?.steps ?? 0) / 1312).toFixed(2)),
  minutesWalked: Math.round(Number(stepsRes?.data?.steps ?? 0) / 105),
});

      setLoading(false);
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    window.addEventListener("workoutAdded", fetchDashboardData);

    return () => {
      clearInterval(interval);
      window.removeEventListener("workoutAdded", fetchDashboardData);
    };
  }, [fetchDashboardData]);

  return { summaryData, dailySummary, weeklyWorkoutSummary, walkingSummary, newBadges, fetchDashboardData, loading };
}