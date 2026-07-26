const jwt = require("jsonwebtoken");

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    const token = header.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
    } catch {
      // invalid/expired token — proceed as guest, don't error
    }
  }
  next();
}

module.exports = optionalAuth;
