import { logStepsService, getStepsService, getTodayStepsService } from "./steps.service.js";

export const logSteps = async (req, res) => {
  const { steps, date } = req.body;
  if (!steps || Number(steps) < 0) return res.status(400).json({ message: "Valid step count is required" });
  try {
    const log = await logStepsService(req.user.id, { steps, date });
    return res.json({ message: "Steps logged successfully", steps: Number(log.steps) });
  } catch (err) {
    console.error("Log steps error:", err);
    return res.status(500).json({ message: "Failed to log steps" });
  }
};

export const getSteps = async (req, res) => {
  try {
    const logs = await getStepsService(req.user.id, req.query);
    return res.json(logs.map(l => ({ ...l, id: Number(l.id), user_id: Number(l.user_id), steps: Number(l.steps) })));
  } catch (err) {
    console.error("Get steps error:", err);
    return res.status(500).json({ message: "Failed to fetch steps" });
  }
};

export const getTodaySteps = async (req, res) => {
  try {
    const data = await getTodayStepsService(req.user.id);
    return res.json(data);
  } catch (err) {
    console.error("Get today steps error:", err);
    return res.status(500).json({ message: "Failed to fetch today's steps" });
  }
};