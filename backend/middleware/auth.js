const supabase = require("../lib/supabase");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not logged in" });
  }
  const token = header.split(" ")[1];
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: "Invalid or expired Supabase session" });
  }
  req.user = data.user;
  req.accessToken = token;
  next();
}

module.exports = requireAuth;
