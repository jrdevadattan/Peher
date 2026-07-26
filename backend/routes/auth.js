const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function makeToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

function safeUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}

// Signup with name/email/password
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed });
    const token = makeToken(user._id);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: "Signup failed" });
  }
});

// Login with email/password
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user || !user.password) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    const token = makeToken(user._id);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Google sign-in
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    let user = await User.findOne({ email: payload.email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name: payload.name,
        email: payload.email.toLowerCase(),
        googleId: payload.sub
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      await user.save();
    }
    const token = makeToken(user._id);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    res.status(401).json({ error: "Google sign-in failed" });
  }
});

module.exports = router;


// Restore session on page refresh
router.get("/me", async (req, res) => {
  const jwt = require("jsonwebtoken");
  const User = require("../models/User");
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not logged in" });
  }
  try {
    const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
});
