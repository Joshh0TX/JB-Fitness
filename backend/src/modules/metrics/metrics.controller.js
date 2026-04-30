import {
  getMetricsService,
  createMetricService,
  updateMetricService,
  deleteMetricService,
  incrementWaterService,
} from "./metrics.service.js";

export const getMetrics = async (req, res) => {
  try {
    const metrics = await getMetricsService(req.user.id, req.query);
    return res.json(metrics);
  } catch (err) {
    console.error("Get metrics error:", err);
    return res.status(500).json({ message: "Failed to fetch metrics" });
  }
};

export const createMetric = async (req, res) => {
  const { date, calories, water_intake, workouts_completed } = req.body;
  if (!date) return res.status(400).json({ message: "Date is required" });
  try {
    const metric = await createMetricService(req.user.id, { date, calories, water_intake, workouts_completed });
    return res.status(201).json({ message: "Metrics created successfully", metricId: metric.id });
  } catch (err) {
    console.error("Create metric error:", err);
    return res.status(err.status || 500).json({ message: err.message || "Failed to create metric" });
  }
};

export const updateMetric = async (req, res) => {
  try {
    await updateMetricService(req.user.id, Number(req.params.id), req.body);
    return res.json({ message: "Metric updated successfully" });
  } catch (err) {
    console.error("Update metric error:", err);
    return res.status(err.status || 500).json({ message: err.message || "Failed to update metric" });
  }
};

export const deleteMetric = async (req, res) => {
  try {
    await deleteMetricService(req.user.id, Number(req.params.id));
    return res.json({ message: "Metric deleted successfully" });
  } catch (err) {
    console.error("Delete metric error:", err);
    return res.status(err.status || 500).json({ message: err.message || "Failed to delete metric" });
  }
};

export const incrementWater = async (req, res) => {
  try {
    const result = await incrementWaterService(req.user.id);
    return res.json(result);
  } catch (err) {
    console.error("Increment water error:", err);
    return res.status(500).json({ message: "Failed to increment water" });
  }
};