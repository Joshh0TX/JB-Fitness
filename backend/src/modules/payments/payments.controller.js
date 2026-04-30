import { initializePaymentService, verifyPaymentService, getCurrentSubscriptionService } from "./payments.service.js";

export const initializePaystackPayment = async (req, res) => {
  try {
    const data = await initializePaymentService(req.user.id, req.body);
    return res.json({ message: "Payment initialized", ...data });
  } catch (err) {
    console.error("Initialize payment error:", err);
    return res.status(err.status || 500).json({ message: err.message || "Failed to initialize payment" });
  }
};

export const verifyPaystackPayment = async (req, res) => {
  const { reference } = req.params;
  if (!reference) return res.status(400).json({ message: "Payment reference is required" });
  try {
    const data = await verifyPaymentService(req.user.id, reference);
    return res.json({ message: "Payment verified successfully", ...data });
  } catch (err) {
    console.error("Verify payment error:", err);
    return res.status(err.status || 500).json({ message: err.message || "Failed to verify payment" });
  }
};

export const getCurrentSubscription = async (req, res) => {
  try {
    const data = await getCurrentSubscriptionService(req.user.id);
    return res.json(data);
  } catch (err) {
    console.error("Get subscription error:", err);
    return res.status(500).json({ message: "Failed to fetch subscription" });
  }
};