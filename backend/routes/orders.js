const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// POST create new order
router.post("/", async (req, res) => {
  try {
    const { items, address, subtotal, total } = req.body;
    if (!items || !items.length) return res.status(400).json({ error: "No items in order" });
    if (!address) return res.status(400).json({ error: "Address is required" });

    const order = await Order.create({ items, address, subtotal, total });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single order by id (for confirmation page later)
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
