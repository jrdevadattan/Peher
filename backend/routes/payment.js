const express = require("express");
const { rateLimit } = require("express-rate-limit");
const Razorpay = require("razorpay");
const requireAuth = require("../middleware/auth");
const supabase = require("../lib/supabase");
const { priceCart } = require("../lib/commerce");
const { publicError, safeErrorMessage } = require("../lib/http-error");
const {
  checkoutDisplayConfig,
  keyMatchesMode,
  verifyPaymentSignature,
} = require("../lib/razorpay-security");

const router = express.Router();
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many payment attempts. Please wait a minute and try again." },
});

function readEnv(name) {
  return String(process.env[name] || "").trim().replace(/^["']|["']$/g, "");
}

function getRazorpayCredentials() {
  const keyId = readEnv("RAZORPAY_KEY_ID");
  const keySecret = readEnv("RAZORPAY_KEY_SECRET");
  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured on the server.");
  }
  return { keyId, keySecret };
}

function getRazorpay() {
  const { keyId, keySecret } = getRazorpayCredentials();
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

function buildReceipt(value) {
  const receipt = String(value || "").trim();
  if (receipt) return receipt.slice(0, 40);
  return `receipt_${Date.now()}`;
}

async function getPaymentSettings() {
  const { data, error } = await supabase
    .from("payment_settings")
    .select("is_enabled, test_mode, allow_cards, allow_upi, allow_netbanking, allow_wallets")
    .eq("id", "razorpay")
    .single();
  if (error || !data) throw publicError("Online payments are temporarily unavailable.", 503);
  return data;
}

function assertCheckoutAvailable(paymentSettings, keyId) {
  const hasPaymentMethod =
    paymentSettings?.allow_cards ||
    paymentSettings?.allow_upi ||
    paymentSettings?.allow_netbanking ||
    paymentSettings?.allow_wallets;
  if (
    !paymentSettings?.is_enabled ||
    !hasPaymentMethod ||
    !keyMatchesMode(keyId, paymentSettings.test_mode)
  ) {
    throw publicError("Online payments are temporarily unavailable.", 503);
  }
}

async function createOrderHandler(req, res) {
  try {
    const { keyId } = getRazorpayCredentials();
    const paymentSettings = await getPaymentSettings();
    assertCheckoutAvailable(paymentSettings, keyId);

    const hasCartItems = Array.isArray(req.body.items) && req.body.items.length > 0;
    const pricing = hasCartItems
      ? await priceCart(req.body.items, req.user.id, req.body.couponCode)
      : null;
    const amount = hasCartItems ? Math.round(pricing.total * 100) : Number(req.body.amount);
    if (!Number.isInteger(amount) || amount < 100) {
      throw publicError("Razorpay order amount must be at least 100 paise.");
    }

    const order = await getRazorpay().orders.create({
      amount,
      currency: String(req.body.currency || "INR").toUpperCase(),
      receipt: buildReceipt(req.body.receipt),
      notes: {
        customer_id: req.user.id,
        coupon_code: pricing?.coupon?.code || "",
      },
    });

    const response = {
      id: order.id,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      checkout: {
        keyId,
        config: checkoutDisplayConfig(paymentSettings),
        testMode: paymentSettings.test_mode,
      },
    };

    if (pricing) {
      response.pricing = {
        subtotal: pricing.subtotal,
        shippingCost: pricing.shippingCost,
        taxAmount: pricing.taxAmount,
        discountAmount: pricing.discountAmount,
        total: pricing.total,
        coupon: pricing.coupon,
      };
    }

    res.json(response);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ error: safeErrorMessage(error, "Could not initiate payment.") });
  }
}

async function verifyPaymentHandler(req, res) {
  try {
    const { keySecret } = getRazorpayCredentials();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ verified: false, error: "Missing payment fields." });
    }
    const verified = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      keySecret,
    );
    if (!verified) return res.status(400).json({ verified: false, error: "Invalid signature" });
    res.json({ verified: true });
  } catch (error) {
    res.status(500).json({ error: "Could not verify payment." });
  }
}

const createOrderMiddlewares = [paymentLimiter, requireAuth, createOrderHandler];
const verifyPaymentMiddlewares = [paymentLimiter, requireAuth, verifyPaymentHandler];

router.post("/create-order", ...createOrderMiddlewares);
router.post("/verify", ...verifyPaymentMiddlewares);

module.exports = router;
module.exports.createOrderMiddlewares = createOrderMiddlewares;
module.exports.verifyPaymentMiddlewares = verifyPaymentMiddlewares;
