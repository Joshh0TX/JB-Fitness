import { getDashboardService, getDashboardSummaryService } from "./dashboard.service.js";

export const getDashboard = async (req, res) => {
  try {
    const data = await getDashboardService(req.user.id);
    return res.json(data);
  } catch (err) {
    console.error("Dashboard error:", err);
    return res.status(500).json({ message: "Failed to fetch dashboard" });
  }
};

export const getDashboardSummary = async (req, res) => {
  try {
    const data = await getDashboardSummaryService(req.user.id);
    return res.json(data);
  } catch (err) {
    console.error("Dashboard summary error:", err);
    return res.status(500).json({ message: "Failed to fetch dashboard summary" });
  }
};