const express = require("express");
const supabase = require("../lib/supabase");
const { publicError, safeErrorMessage } = require("../lib/http-error");

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    if (name.length < 2) throw publicError("Enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw publicError("Enter a valid email address.");
    if (password.length < 10) throw publicError("Password must be at least 10 characters long.");

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        name,
      },
    });

    if (error) {
      const message = String(error.message || "").toLowerCase();
      if (message.includes("already registered") || message.includes("already been registered")) {
        throw publicError("An account with this email already exists.");
      }
      throw error;
    }

    res.status(201).json({ id: data.user?.id });
  } catch (error) {
    res.status(error?.status || 400).json({
      error: safeErrorMessage(error, "Sign up could not be completed."),
    });
  }
});

module.exports = router;
