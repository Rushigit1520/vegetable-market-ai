const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");

// GET /api/reviews/:productId — get reviews for a product
router.get("/:productId", async (req, res) => {
  try {
    const [reviews] = await pool.query(
      `SELECT r.*, u.name as user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.productId]
    );

    // Compute average rating
    const [agg] = await pool.query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
       FROM reviews WHERE product_id = ?`,
      [req.params.productId]
    );

    res.json({
      success: true,
      data: {
        reviews,
        avgRating: agg[0].avg_rating ? parseFloat(agg[0].avg_rating).toFixed(1) : "0.0",
        totalReviews: agg[0].total_reviews,
      },
    });
  } catch (err) {
    console.error("Get reviews error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// POST /api/reviews — submit a review (authenticated user)
router.post("/", authenticate, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Product ID and rating (1-5) are required." });
    }

    // Check if user has ordered this product
    const [ordered] = await pool.query(
      `SELECT oi.id FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.user_id = ? AND oi.product_id = ? AND o.status != 'cancelled'
       LIMIT 1`,
      [req.user.id, productId]
    );

    if (ordered.length === 0) {
      return res.status(400).json({ success: false, message: "You can only review products you have purchased." });
    }

    // Upsert review
    await pool.query(
      `INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment), created_at = CURRENT_TIMESTAMP`,
      [req.user.id, productId, rating, comment || ""]
    );

    // Recalculate product average rating and review count
    const [agg] = await pool.query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
       FROM reviews WHERE product_id = ?`,
      [productId]
    );

    await pool.query(
      "UPDATE products SET rating = ?, reviews = ? WHERE id = ?",
      [parseFloat(agg[0].avg_rating).toFixed(1), agg[0].total_reviews, productId]
    );

    res.json({ success: true, message: "Review submitted successfully!" });
  } catch (err) {
    console.error("Submit review error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// DELETE /api/reviews/:reviewId — delete own review
router.delete("/:reviewId", authenticate, async (req, res) => {
  try {
    const [review] = await pool.query(
      "SELECT * FROM reviews WHERE id = ? AND user_id = ?",
      [req.params.reviewId, req.user.id]
    );

    if (review.length === 0) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    const productId = review[0].product_id;
    await pool.query("DELETE FROM reviews WHERE id = ?", [req.params.reviewId]);

    // Recalculate
    const [agg] = await pool.query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
       FROM reviews WHERE product_id = ?`,
      [productId]
    );

    await pool.query(
      "UPDATE products SET rating = ?, reviews = ? WHERE id = ?",
      [agg[0].avg_rating ? parseFloat(agg[0].avg_rating).toFixed(1) : 0, agg[0].total_reviews, productId]
    );

    res.json({ success: true, message: "Review deleted." });
  } catch (err) {
    console.error("Delete review error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
