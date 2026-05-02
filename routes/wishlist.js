const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");

// All wishlist routes require authentication
router.use(authenticate);

// GET /api/wishlist — get user's wishlist
router.get("/", async (req, res) => {
  try {
    const [items] = await pool.query(
      `SELECT w.id, w.product_id, w.created_at,
              p.name, p.category, p.price, p.original_price, p.unit, p.image, p.stock, p.rating, p.reviews
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, data: items });
  } catch (err) {
    console.error("Get wishlist error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// POST /api/wishlist — add product to wishlist { productId }
router.post("/", async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: "productId is required." });
    }

    // Check product exists
    const [products] = await pool.query("SELECT id FROM products WHERE id = ?", [productId]);
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    // Upsert — ignore if already exists
    await pool.query(
      "INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)",
      [req.user.id, productId]
    );

    res.json({ success: true, message: "Added to wishlist" });
  } catch (err) {
    console.error("Add to wishlist error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// DELETE /api/wishlist/:productId — remove from wishlist
router.delete("/:productId", async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM wishlist WHERE user_id = ? AND product_id = ?",
      [req.user.id, req.params.productId]
    );
    res.json({ success: true, message: "Removed from wishlist" });
  } catch (err) {
    console.error("Remove from wishlist error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/wishlist/check/:productId — check if product is in wishlist
router.get("/check/:productId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?",
      [req.user.id, req.params.productId]
    );
    res.json({ success: true, data: { inWishlist: rows.length > 0 } });
  } catch (err) {
    console.error("Check wishlist error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
