const express = require("express");
const { rateLimit } = require("express-rate-limit");
const Razorpay = require("razorpay");
const requireAuth = require("../middleware/auth");
const supabase = require("../lib/supabase");
const { priceCart } = require("../lib/commerce");
const { publicError, safeErrorMessage } = require("../lib/http-error");
const { keyMatchesMode, verifyPaymentSignature } = require("../lib/razorpay-security");

const router = express.Router();
const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many order attempts. Please wait a minute and try again." },
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

function validSignature(orderId, paymentId, signature) {
  const { keySecret } = getRazorpayCredentials();
  return verifyPaymentSignature(
    orderId,
    paymentId,
    signature,
    keySecret,
  );
}

function validAddress(address) {
  const within = (value, minimum, maximum) => {
    const length = String(value || "").trim().length;
    return length >= minimum && length <= maximum;
  };
  const phoneDigits = String(address?.phone || "").replace(/\D/g, "").slice(-10);
  const pincodeDigits = String(address?.pincode || "").replace(/\D/g, "");
  return (
    address &&
    within(address.fullName, 2, 120) &&
    phoneDigits.length === 10 &&
    within(address.addressLine1, 3, 250) &&
    within(address.addressLine2, 0, 250) &&
    within(address.city, 2, 100) &&
    within(address.state, 2, 100) &&
    pincodeDigits.length === 6
  );
}

function normalizeAddress(address) {
  return {
    fullName: String(address.fullName || "").trim(),
    phone: String(address.phone || "").replace(/\D/g, "").slice(-10),
    addressLine1: String(address.addressLine1 || "").trim(),
    addressLine2: String(address.addressLine2 || "").trim(),
    city: String(address.city || "").trim(),
    state: String(address.state || "").trim(),
    pincode: String(address.pincode || "").replace(/\D/g, ""),
  };
}

router.post("/", orderLimiter, requireAuth, async (req, res) => {
  try {
    const { items, address, couponCode, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      req.body;
    if (!Array.isArray(items) || !items.length || !validAddress(address)) {
      return res.status(400).json({ error: "Missing or invalid order fields." });
    }
    if (!validSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      return res.status(400).json({ error: "Invalid payment signature." });
    }
    const normalizedAddress = normalizeAddress(address);

    const pricing = await priceCart(items, req.user.id, couponCode);
    const { keyId } = getRazorpayCredentials();
    const { data: paymentSettings, error: paymentSettingsError } = await supabase
      .from("payment_settings")
      .select("is_enabled, test_mode, automatic_capture")
      .eq("id", "razorpay")
      .single();
    if (
      paymentSettingsError ||
      !paymentSettings?.is_enabled ||
      !keyMatchesMode(keyId, paymentSettings.test_mode)
    ) {
      return res.status(503).json({ error: "Online payments are temporarily unavailable." });
    }

    const razorpay = getRazorpay();
    const [payment, paymentOrder] = await Promise.all([
      razorpay.payments.fetch(razorpayPaymentId),
      razorpay.orders.fetch(razorpayOrderId),
    ]);
    const expectedAmount = Math.round(pricing.total * 100);
    if (
      payment.order_id !== razorpayOrderId ||
      paymentOrder.id !== razorpayOrderId ||
      paymentOrder.notes?.customer_id !== req.user.id ||
      Number(payment.amount) !== expectedAmount ||
      Number(paymentOrder.amount) !== expectedAmount
    ) {
      return res.status(400).json({ error: "Payment amount or status does not match this order." });
    }

    let confirmedPayment = payment;
    if (payment.status === "authorized" && paymentSettings.automatic_capture) {
      confirmedPayment = await razorpay.payments.capture(
        razorpayPaymentId,
        expectedAmount,
        payment.currency || "INR",
      );
    }
    if (confirmedPayment.status !== "captured") {
      return res.status(409).json({
        error: "Payment is awaiting capture. Please contact support before retrying.",
      });
    }

    const shippingAddress = [
      normalizedAddress.addressLine1,
      normalizedAddress.addressLine2,
      normalizedAddress.city,
      normalizedAddress.state,
      normalizedAddress.pincode,
    ]
      .filter(Boolean)
      .map((value) => String(value).trim())
      .join(", ");

    const { data, error: finalizeError } = await supabase.rpc("finalize_paid_order", {
      p_customer_id: req.user.id,
      p_customer_name: normalizedAddress.fullName,
      p_customer_email: req.user.email,
      p_customer_phone: normalizedAddress.phone,
      p_shipping_address: shippingAddress,
      p_payment_order_id: razorpayOrderId,
      p_payment_id: razorpayPaymentId,
      p_items: pricing.items,
      p_subtotal: pricing.subtotal,
      p_shipping_cost: pricing.shippingCost,
      p_tax_amount: 0,
      p_coupon_code: pricing.coupon?.code || null,
    });
    if (finalizeError) {
      if (finalizeError.code === "P0001" || finalizeError.code === "22023") {
        throw publicError(finalizeError.message);
      }
      throw finalizeError;
    }
    const result = data?.[0];
    if (!result) throw publicError("The paid order could not be finalized.");

    await supabase
      .from("profiles")
      .update({ phone: normalizedAddress.phone, last_login_at: new Date().toISOString() })
      .eq("id", req.user.id);

    res.status(result.already_exists ? 200 : 201).json({
      id: result.order_id,
      orderNumber: result.order_number,
      discountAmount: Number(result.discount_amount),
      total: Number(result.order_total),
      alreadyExists: result.already_exists,
    });
  } catch (error) {
    res.status(400).json({ error: safeErrorMessage(error, "Could not create order.") });
  }
});

router.get("/my", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("customer_id", req.user.id)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Could not fetch orders" });
  res.json(data || []);
});

module.exports = router;
