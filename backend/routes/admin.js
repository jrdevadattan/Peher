const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "peher_admin_secret_key_2026";

// Admin Login Endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email.toLowerCase() === "admin@peher.studio" && (password === "admin123" || await bcrypt.compare(password, await bcrypt.hash("admin123", 10)))) {
      const token = jwt.sign(
        { id: "adm-001", email: "admin@peher.studio", role: "Owner" },
        JWT_SECRET,
        { expiresIn: "12h" }
      );
      return res.json({
        token,
        user: {
          id: "adm-001",
          name: "Vasudha Tiwari",
          email: "admin@peher.studio",
          role: "Owner",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          twoFactorEnabled: true,
        },
      });
    }
    return res.status(401).json({ error: "Invalid admin email or password." });
  } catch (err) {
    return res.status(500).json({ error: "Server authentication error." });
  }
});

// Admin Me / Session verification
router.get("/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({
      user: {
        id: decoded.id,
        name: "Vasudha Tiwari",
        email: decoded.email,
        role: decoded.role,
        twoFactorEnabled: true,
      },
    });
  } catch {
    return res.status(401).json({ error: "Session expired or invalid" });
  }
});

// Admin Dashboard KPI Stats API
router.get("/stats", (req, res) => {
  res.json({
    totalSales: 98720,
    todaySales: 36200,
    ordersCount: 14,
    pendingOrders: 2,
    customersCount: 104,
    productsCount: 8,
    lowStockCount: 2,
  });
});

module.exports = router;
