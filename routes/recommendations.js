const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");

// GET /api/recommendations — AI Smart Picks
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Analyze User Preferences
    // Find categories of products the user has ordered previously or has in cart
    const [preferences] = await pool.query(`
      SELECT p.category, COUNT(*) as weight
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.user_id = ?
      LEFT JOIN cart c ON p.id = c.product_id AND c.user_id = ?
      WHERE o.id IS NOT NULL OR c.id IS NOT NULL
      GROUP BY p.category
      ORDER BY weight DESC
      LIMIT 3
    `, [userId, userId]);

    let recommendedProducts = [];

    // 2. Fetch recommendations based on favorite categories
    if (preferences.length > 0) {
      const categories = preferences.map(pref => pref.category);
      
      const [results] = await pool.query(`
        SELECT * FROM products 
        WHERE category IN (?) 
        AND stock > 0
        ORDER BY rating DESC, reviews DESC
        LIMIT 6
      `, [categories]);
      
      recommendedProducts = results;
    }

    // 3. Fallback or Padding: Fill with global top trending/rated products if not enough recommendations
    if (recommendedProducts.length < 6) {
      const excludeIds = recommendedProducts.length > 0 
        ? recommendedProducts.map(p => p.id) 
        : [0]; // Dummy ID to prevent empty IN clause error
        
      const limitNeeded = 6 - recommendedProducts.length;
      
      const [trending] = await pool.query(`
        SELECT * FROM products 
        WHERE id NOT IN (?)
        AND stock > 0
        ORDER BY rating DESC, reviews DESC
        LIMIT ?
      `, [excludeIds, limitNeeded]);
      
      recommendedProducts = [...recommendedProducts, ...trending];
    }

    // 4. Generate AI Insight Context message
    let insightMessage = "Based on your recent activity, we recommend these top-rated fresh items.";
    if (preferences.length > 0) {
      const topCat = preferences[0].category;
      insightMessage = `We noticed you love ${topCat}! Here are some hand-picked fresh items from our farms just for you.`;
    }

    res.json({
      success: true,
      data: {
        message: insightMessage,
        products: recommendedProducts
      }
    });

  } catch (err) {
    console.error("Recommendations API error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
