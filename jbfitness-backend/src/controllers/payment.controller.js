import axios from "axios";
import db from "../config/db.js";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

const getAllowedOrigins = () => {
  const raw = String(process.env.ALLOWED_ORIGINS || "");
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const isAllowedCallbackUrl = (value) => {
  if (!value) return false;

  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    const allowedOrigins = getAllowedOrigins();
    if (!allowedOrigins.length) {
      return true;
    }

    return allowedOrigins.includes(parsed.origin);
  } catch {
    return false;
  }
};

const PLAN_CONFIG = {
  premium_monthly: {
    key: "premium_monthly",
    name: "Premium Monthly",
    amountKobo: Number(process.env.PAYSTACK_PREMIUM_MONTHLY_AMOUNT_KOBO || 99900),
    intervalLabel: "month",
  },
};

const getPlanConfig = (planKey = "premium_monthly") => {
  return PLAN_CONFIG[planKey] || PLAN_CONFIG.premium_monthly;
};

const formatNaira = (amountKobo) => {
  const amountNaira = Number(amountKobo || 0) / 100;
  return `₦${amountNaira.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const initializePaystackPayment = async (req, res) => {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({ message: "Paystack secret key is not configured" });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [[user]] = await db.query(
      "SELECT id, username, email FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const planConfig = getPlanConfig(req.body?.plan);

    const payload = {
      email: user.email,
      amount: planConfig.amountKobo,
      metadata: {
        user_id: user.id,
        username: user.username,
        plan_key: planConfig.key,
        plan_name: planConfig.name,
      },
    };

    const callbackUrl = req.body?.callbackUrl;

    if (callbackUrl) {
      if (!isAllowedCallbackUrl(callbackUrl)) {
        return res.status(400).json({ message: "Invalid callback URL" });
      }
      payload.callback_url = callbackUrl;
    }

    if (!payload.callback_url && process.env.PAYSTACK_CALLBACK_URL) {
      payload.callback_url = process.env.PAYSTACK_CALLBACK_URL;
    }

    const paystackResponse = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!paystackResponse?.data?.status) {
      return res.status(502).json({ message: "Failed to initialize Paystack transaction" });
    }

    return res.status(200).json({
      message: "Payment initialized",
      authorizationUrl: paystackResponse.data.data.authorization_url,
      accessCode: paystackResponse.data.data.access_code,
      reference: paystackResponse.data.data.reference,
      plan: {
        key: planConfig.key,
        name: planConfig.name,
        amountKobo: planConfig.amountKobo,
        priceDisplay: `${formatNaira(planConfig.amountKobo)}/${planConfig.intervalLabel}`,
      },
    });
  } catch (error) {
    const paystackMessage = error?.response?.data?.message;
    return res.status(500).json({
      message: paystackMessage || "Failed to initialize payment",
    });
  }
};

export const verifyPaystackPayment = async (req, res) => {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({ message: "Paystack secret key is not configured" });
    }

    const userId = req.user?.id;
    const reference = req.params.reference;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!reference) {
      return res.status(400).json({ message: "Payment reference is required" });
    }

    const paystackResponse = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const verification = paystackResponse?.data?.data;
    if (!paystackResponse?.data?.status || !verification) {
      return res.status(502).json({ message: "Unable to verify payment" });
    }

    const metadataUserId = Number(verification?.metadata?.user_id);
    if (metadataUserId && metadataUserId !== Number(userId)) {
      return res.status(403).json({ message: "This payment reference does not belong to this user" });
    }

    if (verification.status !== "success") {
      return res.status(400).json({
        message: "Payment not successful",
        paymentStatus: verification.status,
      });
    }

    const planConfig = getPlanConfig(verification?.metadata?.plan_key);

    await db.query(
      "UPDATE subscriptions SET status = 'inactive' WHERE user_id = ? AND status = 'active'",
      [userId]
    );

    const [insertResult] = await db.query(
      "INSERT INTO subscriptions (user_id, plan, status) VALUES (?, ?, ?)",
      [userId, planConfig.name, "active"]
    );

    const [[subscription]] = await db.query(
      "SELECT id, plan, status, started_at FROM subscriptions WHERE id = ? LIMIT 1",
      [insertResult.insertId]
    );

    return res.status(200).json({
      message: "Payment verified successfully",
      subscription: {
        ...subscription,
        planKey: planConfig.key,
        priceDisplay: `${formatNaira(planConfig.amountKobo)}/${planConfig.intervalLabel}`,
      },
      payment: {
        reference: verification.reference,
        amountKobo: verification.amount,
        paidAt: verification.paid_at,
        channel: verification.channel,
      },
    });
  } catch (error) {
    const paystackMessage = error?.response?.data?.message;
    return res.status(500).json({
      message: paystackMessage || "Failed to verify payment",
    });
  }
};

export const getCurrentSubscription = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [rows] = await db.query(
      `SELECT id, plan, status, started_at
       FROM subscriptions
       WHERE user_id = ?
       ORDER BY started_at DESC, id DESC
       LIMIT 1`,
      [userId]
    );

    if (!rows.length) {
      return res.status(200).json({
        hasSubscription: false,
        planName: "No Active Plan",
        priceDisplay: "Free",
        renewalText: "Upgrade to premium to unlock subscription benefits",
        status: "inactive",
      });
    }

    const subscription = rows[0];
    const isActive = String(subscription.status || "").toLowerCase() === "active";
    const defaultPlan = getPlanConfig();

    return res.status(200).json({
      hasSubscription: true,
      id: subscription.id,
      planName: subscription.plan,
      status: subscription.status,
      startedAt: subscription.started_at,
      priceDisplay: `${formatNaira(defaultPlan.amountKobo)}/${defaultPlan.intervalLabel}`,
      renewalText: isActive
        ? `Started ${new Date(subscription.started_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}`
        : "Subscription is not active",
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch subscription" });
  }
};
