const express = require("express");
const { rateLimit } = require("express-rate-limit");
const requireAuth = require("../middleware/auth");
const { priceCart } = require("../lib/commerce");
const { safeErrorMessage } = require("../lib/http-error");

const router = express.Router();

const couponLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many coupon attempts. Please wait a minute and try again." },
});

router.post("/validate", couponLimiter, requireAuth, async (req, res) => {
  try {
    const pricing = await priceCart(req.body.items, req.user.id, req.body.code);
    res.json({
      coupon: pricing.coupon,
      subtotal: pricing.subtotal,
      shippingCost: pricing.shippingCost,
      taxAmount: pricing.taxAmount,
      discountAmount: pricing.discountAmount,
      total: pricing.total,
    });
  } catch (error) {
    res.status(400).json({ error: safeErrorMessage(error, "This coupon could not be applied.") });
  }
});

module.exports = router;
