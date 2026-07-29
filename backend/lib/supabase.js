const { createClient } = require("@supabase/supabase-js");

function normalizeEnv(value) {
  return String(value || "").trim().replace(/^["']|["']$/g, "");
}

const supabaseUrl = normalizeEnv(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
const supabaseSecretKey = normalizeEnv(
  process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY,
);

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SECRET_KEY are required. On Vercel, SUPABASE_SERVICE_ROLE_KEY is also accepted for the secret key.",
  );
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

if (!isServerCredential(supabaseSecretKey)) {
  throw new Error(
    "SUPABASE_SECRET_KEY must be a secret server key or legacy service_role key, never a publishable key.",
  );
}

module.exports = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
