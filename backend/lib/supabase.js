const { createClient } = require("@supabase/supabase-js");

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY are required.");
}

function isServerCredential(value) {
  if (value.startsWith("sb_secret_")) return true;
  if (!value.includes(".")) return false;
  try {
    const payload = JSON.parse(Buffer.from(value.split(".")[1], "base64url").toString("utf8"));
    return payload.role === "service_role";
  } catch {
    return false;
  }
}

if (!isServerCredential(process.env.SUPABASE_SECRET_KEY)) {
  throw new Error(
    "SUPABASE_SECRET_KEY must be a secret server key or legacy service_role key, never a publishable key.",
  );
}

module.exports = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
