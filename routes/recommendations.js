const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");

// GET /api/recommendations — AI Smart Picks
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const [preferences] = await pool.query(`
      SELECT p.category, COUNT(*) as weight
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.user_id = ?
      LEFT JOIN cart c ON p.id = c.product_id AND c.user_id = ?
      WHERE o.id IS NOT NULL OR c.id IS NOT NULL
      GROUP BY p.category ORDER BY weight DESC LIMIT 3
    `, [userId, userId]);

    let recommendedProducts = [];

    if (preferences.length > 0) {
      const categories = preferences.map(pref => pref.category);
      const [results] = await pool.query(
        `SELECT * FROM products WHERE category IN (?) AND stock > 0 ORDER BY rating DESC, reviews DESC LIMIT 6`,
        [categories]
      );
      recommendedProducts = results;
    }

    if (recommendedProducts.length < 6) {
      const excludeIds = recommendedProducts.length > 0 ? recommendedProducts.map(p => p.id) : [0];
      const limitNeeded = 6 - recommendedProducts.length;
      const [trending] = await pool.query(
        `SELECT * FROM products WHERE id NOT IN (?) AND stock > 0 ORDER BY rating DESC, reviews DESC LIMIT ?`,
        [excludeIds, limitNeeded]
      );
      recommendedProducts = [...recommendedProducts, ...trending];
    }

    let insightMessage = "Based on your recent activity, we recommend these top-rated fresh items.";
    if (preferences.length > 0) {
      const topCat = preferences[0].category;
      insightMessage = `We noticed you love ${topCat}! Here are some hand-picked fresh items from our farms just for you.`;
    }

    res.json({ success: true, data: { message: insightMessage, products: recommendedProducts } });
  } catch (err) {
    console.error("Recommendations API error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/recommendations/frequently-bought/:productId — Frequently Bought Together
router.get("/frequently-bought/:productId", async (req, res) => {
  try {
    const productId = req.params.productId;

    // Find products that appear in the same orders as the given product
    const [results] = await pool.query(`
      SELECT p.*, COUNT(*) as co_purchase_count
      FROM order_items oi1
      JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi1.product_id != oi2.product_id
      JOIN products p ON oi2.product_id = p.id
      WHERE oi1.product_id = ? AND p.stock > 0
      GROUP BY p.id
      ORDER BY co_purchase_count DESC
      LIMIT 4
    `, [productId]);

    // If not enough co-purchases, pad with same-category products
    if (results.length < 4) {
      const [product] = await pool.query("SELECT category FROM products WHERE id = ?", [productId]);
      if (product.length > 0) {
        const excludeIds = [productId, ...results.map(r => r.id)];
        const needed = 4 - results.length;
        const [catProducts] = await pool.query(
          `SELECT * FROM products WHERE category = ? AND id NOT IN (?) AND stock > 0 ORDER BY rating DESC LIMIT ?`,
          [product[0].category, excludeIds, needed]
        );
        results.push(...catProducts);
      }
    }

    res.json({ success: true, data: results });
  } catch (err) {
    console.error("Frequently bought together error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/recommendations/price-trend/:productId — Price history for a product
router.get("/price-trend/:productId", async (req, res) => {
  try {
    const [history] = await pool.query(
      `SELECT price, DATE(recorded_at) as date FROM price_history
       WHERE product_id = ? ORDER BY recorded_at DESC LIMIT 30`,
      [req.params.productId]
    );

    const [current] = await pool.query("SELECT price FROM products WHERE id = ?", [req.params.productId]);

    let insight = "stable";
    if (history.length >= 2) {
      const avg = history.reduce((s, h) => s + parseFloat(h.price), 0) / history.length;
      const currentPrice = parseFloat(current[0]?.price || 0);
      if (currentPrice < avg * 0.95) insight = "lower_than_usual";
      else if (currentPrice > avg * 1.05) insight = "higher_than_usual";
    }

    res.json({ success: true, data: { history: history.reverse(), insight } });
  } catch (err) {
    console.error("Price trend error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
