const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

/**
 * Authenticate — verifies JWT token from Authorization header.
 * Attaches decoded user to req.user
 * Returns specific error codes for frontend to handle refresh flow.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
      code: "NO_TOKEN",
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired.",
        code: "TOKEN_EXPIRED",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid token.",
      code: "INVALID_TOKEN",
    });
  }
}

/**
 * Require Admin — checks if authenticated user has admin role
 */
function requireStrictAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden. Admin access required." });
  }
  next();
}

// Check if Admin OR Employee (Staff)
function requireStaff(req, res, next) {
  if (req.user.role !== "admin" && req.user.role !== "employee") {
    return res.status(403).json({ success: false, message: "Forbidden. Staff access required." });
  }
  next();
}

module.exports = { authenticate, requireStrictAdmin, requireStaff };
