const crypto = require("crypto");
const express = require("express");
const { rateLimit } = require("express-rate-limit");
const Razorpay = require("razorpay");
const requireAuth = require("../middleware/auth");
const { priceCart } = require("../lib/commerce");
const { safeErrorMessage } = require("../lib/http-error");

const router = express.Router();
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many payment attempts. Please wait a minute and try again." },
});

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay is not configured on the server.");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

router.post("/create-order", paymentLimiter, requireAuth, async (req, res) => {
  try {
    const { data: paymentSettings, error: settingsError } = await require("../lib/supabase")
      .from("payment_settings")
      .select("is_enabled")
      .eq("id", "razorpay")
      .single();
    if (
      settingsError ||
      !paymentSettings?.is_enabled ||
      !process.env.RAZORPAY_KEY_ID ||
      !process.env.RAZORPAY_KEY_SECRET
    ) {
      return res.status(503).json({ error: "Online payments are temporarily unavailable." });
    }
    const pricing = await priceCart(req.body.items, req.user.id, req.body.couponCode);
    if (pricing.total <= 0) {
      return res.status(400).json({ error: "The payable amount must be greater than zero." });
    }

    const order = await getRazorpay().orders.create({
      amount: Math.round(pricing.total * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        customer_id: req.user.id,
        coupon_code: pricing.coupon?.code || "",
      },
    });

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      pricing: {
        subtotal: pricing.subtotal,
        shippingCost: pricing.shippingCost,
        taxAmount: pricing.taxAmount,
        discountAmount: pricing.discountAmount,
        total: pricing.total,
        coupon: pricing.coupon,
      },
    });
  } catch (error) {
    res.status(400).json({ error: safeErrorMessage(error, "Could not initiate payment.") });
  }
});

router.post("/verify", paymentLimiter, requireAuth, async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ error: "Online payments are temporarily unavailable." });
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(String(razorpay_signature || ""));
    const verified =
      expectedBuffer.length === actualBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    if (!verified) return res.status(400).json({ verified: false, error: "Invalid signature" });
    res.json({ verified: true });
  } catch (error) {
    res.status(400).json({ error: "Could not verify payment." });
  }
});

module.exports = router;
