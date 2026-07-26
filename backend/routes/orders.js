const express = require("express");
const requireAuth = require("../middleware/auth");
const Order = require("../models/Order");

const router = express.Router();

// Create an order — must be logged in. Only reached after Razorpay signature is verified client-side.
router.post("/", requireAuth, async (req, res) => {
  try {
    const { items, address, subtotal, total, razorpayOrderId, razorpayPaymentId } = req.body;
    if (!items || !items.length || !address || subtotal == null || total == null) {
      return res.status(400).json({ error: "Missing required order fields" });
    }
    if (!razorpayOrderId || !razorpayPaymentId) {
      return res.status(400).json({ error: "Missing payment reference" });
    }
    const order = await Order.create({
      user: req.userId,
      items,
      address,
      subtotal,
      total,
      razorpayOrderId,
      razorpayPaymentId,
      paymentStatus: "paid",
      status: "confirmed",
    });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Could not create order" });
  }
});

// Logged-in user's own orders
router.get("/my", requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch orders" });
  }
});

module.exports = router;
