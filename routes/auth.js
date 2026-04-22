const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { authenticate, requireStrictAdmin } = require("../middleware/auth");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate inputs
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    // Check if user already exists
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "Email is already registered." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')",
      [name, email, hashedPassword]
    );

    // Generate token
    const token = jwt.sign(
      { id: result.insertId, name, email, role: "user" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "Registration successful!",
      data: {
        token,
        user: { id: result.insertId, name, email, role: "user" },
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    // Find user
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const user = users[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful!",
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

/**
 * @route   POST /api/auth/register-employee
 * @desc    Register a new employee (Only Admins can do this)
 * @access  Admin
 */
router.post("/register-employee", authenticate, requireStrictAdmin, async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Please provide all required fields" });
  }

  try {
    // Check if user exists
    const [existing] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "User already exists with this email" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user with role 'employee'
    await pool.query("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'employee')", [
      name,
      email,
      hashedPassword,
    ]);

    res.status(201).json({ success: true, message: "Employee registered successfully." });
  } catch (err) {
    console.error("Register employee error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * @route   GET /api/auth/employees
 * @desc    Get all employees
 * @access  Admin
 */
router.get("/employees", authenticate, requireStrictAdmin, async (req, res) => {
  try {
    const [employees] = await pool.query(
      "SELECT id, name, email, role, created_at FROM users WHERE role = 'employee' ORDER BY created_at DESC"
    );
    res.json({ success: true, data: employees });
  } catch (err) {
    console.error("Get employees error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

/**
 * @route   DELETE /api/auth/employee/:id
 * @desc    Delete an employee
 * @access  Admin
 */
router.delete("/employee/:id", authenticate, requireStrictAdmin, async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM users WHERE id = ? AND role = 'employee'",
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }
    res.json({ success: true, message: "Employee terminated successfully." });
  } catch (err) {
    console.error("Delete employee error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/auth/me — get current user profile
router.get("/me", authenticate, async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.json({ success: true, data: users[0] });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
