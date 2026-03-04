import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  initializePaystackPayment,
  verifyPaystackPayment,
  getCurrentSubscription,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/paystack/initialize", authMiddleware, initializePaystackPayment);
router.get("/paystack/verify/:reference", authMiddleware, verifyPaystackPayment);
router.get("/subscription/current", authMiddleware, getCurrentSubscription);

export default router;
