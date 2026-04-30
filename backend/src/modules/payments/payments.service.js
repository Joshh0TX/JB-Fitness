import axios from "axios";
import prisma from "../../config/db.js";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

const PLAN_CONFIG = {
  premium_monthly: {
    key: "premium_monthly",
    name: "Premium Monthly",
    amountKobo: Number(process.env.PAYSTACK_PREMIUM_MONTHLY_AMOUNT_KOBO || 99900),
    intervalLabel: "month",
  },
};

const getPlanConfig = (planKey = "premium_monthly") => PLAN_CONFIG[planKey] || PLAN_CONFIG.premium_monthly;

const formatNaira = (amountKobo) => {
  const naira = Number(amountKobo || 0) / 100;
  return `₦${naira.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getPaystackKey = () => {
  const keys = ["PAYSTACK_SECRET_KEY", "PAYSTACK_SECRET", "PAYSTACK_TEST_SECRET_KEY", "PAYSTACK_LIVE_SECRET_KEY"];
  for (const k of keys) {
    const val = String(process.env[k] || "").trim();
    if (val) return val;
  }
  return "";
};

const isAllowedCallbackUrl = (value) => {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    const allowed = String(process.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);
    return !allowed.length || allowed.includes(parsed.origin);
  } catch { return false; }
};

export const initializePaymentService = async (userId, { plan, callbackUrl }) => {
  const key = getPaystackKey();
  if (!key) throw { status: 500, message: "Paystack secret key is not configured" };

  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) throw { status: 404, message: "User not found" };

  const planConfig = getPlanConfig(plan);
  const payload = {
    email: user.email,
    amount: planConfig.amountKobo,
    metadata: { user_id: user.id, username: user.name, plan_key: planConfig.key, plan_name: planConfig.name },
  };

  if (callbackUrl) {
    if (!isAllowedCallbackUrl(callbackUrl)) throw { status: 400, message: "Invalid callback URL" };
    payload.callback_url = callbackUrl;
  } else if (process.env.PAYSTACK_CALLBACK_URL) {
    payload.callback_url = process.env.PAYSTACK_CALLBACK_URL;
  }

  const response = await axios.post(`${PAYSTACK_BASE_URL}/transaction/initialize`, payload, {
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  });

  if (!response?.data?.status) throw { status: 502, message: "Failed to initialize Paystack transaction" };

  return {
    authorizationUrl: response.data.data.authorization_url,
    accessCode: response.data.data.access_code,
    reference: response.data.data.reference,
    plan: { key: planConfig.key, name: planConfig.name, amountKobo: planConfig.amountKobo, priceDisplay: `${formatNaira(planConfig.amountKobo)}/${planConfig.intervalLabel}` },
  };
};

export const verifyPaymentService = async (userId, reference) => {
  const key = getPaystackKey();
  if (!key) throw { status: 500, message: "Paystack secret key is not configured" };

  const response = await axios.get(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });

  const verification = response?.data?.data;
  if (!response?.data?.status || !verification) throw { status: 502, message: "Unable to verify payment" };

  const metadataUserId = Number(verification?.metadata?.user_id);
  if (metadataUserId && metadataUserId !== Number(userId)) throw { status: 403, message: "Payment reference does not belong to this user" };
  if (verification.status !== "success") throw { status: 400, message: "Payment not successful" };

  const planConfig = getPlanConfig(verification?.metadata?.plan_key);

  await prisma.subscriptions.updateMany({ where: { user_id: userId, status: "active" }, data: { status: "inactive" } });

  const subscription = await prisma.subscriptions.create({
    data: { user_id: userId, plan: planConfig.name, status: "active" },
  });

  return {
    subscription: { ...subscription, planKey: planConfig.key, priceDisplay: `${formatNaira(planConfig.amountKobo)}/${planConfig.intervalLabel}` },
    payment: { reference: verification.reference, amountKobo: verification.amount, paidAt: verification.paid_at, channel: verification.channel },
  };
};

export const getCurrentSubscriptionService = async (userId) => {
  const subscription = await prisma.subscriptions.findFirst({
    where: { user_id: userId },
    orderBy: [{ started_at: "desc" }, { id: "desc" }],
  });

  if (!subscription) {
    return { hasSubscription: false, planName: "No Active Plan", priceDisplay: "Free", status: "inactive", renewalText: "Upgrade to premium to unlock subscription benefits" };
  }

  const isActive = subscription.status?.toLowerCase() === "active";
  const planConfig = getPlanConfig();

  return {
    hasSubscription: true,
    id: subscription.id,
    planName: subscription.plan,
    status: subscription.status,
    startedAt: subscription.started_at,
    priceDisplay: `${formatNaira(planConfig.amountKobo)}/${planConfig.intervalLabel}`,
    renewalText: isActive
      ? `Started ${new Date(subscription.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
      : "Subscription is not active",
  };
};