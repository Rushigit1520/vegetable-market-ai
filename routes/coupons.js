const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authenticate, requireStaff } = require("../middleware/auth");

// GET /api/coupons/validate/:code — validate a coupon code
router.get("/validate/:code", authenticate, async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const [coupons] = await pool.query(
      "SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND (uses_remaining = -1 OR uses_remaining > 0) AND (expires_at IS NULL OR expires_at > NOW())",
      [code]
    );

    if (coupons.length === 0) {
      return res.status(404).json({ success: false, message: "Invalid or expired coupon code." });
    }

    const coupon = coupons[0];
    res.json({
      success: true,
      data: {
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: parseFloat(coupon.discount_value),
        min_order: parseFloat(coupon.min_order),
        max_discount: coupon.max_discount ? parseFloat(coupon.max_discount) : null,
      },
    });
  } catch (err) {
    console.error("Validate coupon error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/coupons — list all available coupons for the user
router.get("/", authenticate, async (req, res) => {
  try {
    const [coupons] = await pool.query(
      "SELECT code, description, discount_type, discount_value, min_order, max_discount FROM coupons WHERE is_active = 1 AND (uses_remaining = -1 OR uses_remaining > 0) AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY discount_value DESC"
    );

    res.json({
      success: true,
      data: coupons.map((c) => ({
        ...c,
        discount_value: parseFloat(c.discount_value),
        min_order: parseFloat(c.min_order),
        max_discount: c.max_discount ? parseFloat(c.max_discount) : null,
      })),
    });
  } catch (err) {
    console.error("List coupons error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ============ ADMIN ROUTES ============

// GET /api/coupons/admin/all — list all coupons (staff)
router.get("/admin/all", authenticate, requireStaff, async (req, res) => {
  try {
    const [coupons] = await pool.query("SELECT * FROM coupons ORDER BY created_at DESC");
    res.json({ success: true, data: coupons });
  } catch (err) {
    console.error("Admin list coupons error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// POST /api/coupons — create coupon (staff)
router.post("/", authenticate, requireStaff, async (req, res) => {
  try {
    const { code, description, discount_type, discount_value, min_order, max_discount, expires_at } = req.body;

    if (!code || !discount_type || !discount_value) {
      return res.status(400).json({ success: false, message: "Code, discount_type, and discount_value are required." });
    }

    await pool.query(
      "INSERT INTO coupons (code, description, discount_type, discount_value, min_order, max_discount, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [code.toUpperCase(), description || "", discount_type, discount_value, min_order || 0, max_discount || null, expires_at || null]
    );

    res.status(201).json({ success: true, message: "Coupon created!" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Coupon code already exists." });
    }
    console.error("Create coupon error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// DELETE /api/coupons/:id — delete coupon (staff)
router.delete("/:id", authenticate, requireStaff, async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM coupons WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Coupon not found." });
    }
    res.json({ success: true, message: "Coupon deleted." });
  } catch (err) {
    console.error("Delete coupon error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
