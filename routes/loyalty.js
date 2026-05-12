const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

// GET /api/loyalty — get user's loyalty points summary
router.get("/", async (req, res) => {
  try {
    const [user] = await pool.query(
      "SELECT loyalty_points FROM users WHERE id = ?",
      [req.user.id]
    );

    const [transactions] = await pool.query(
      `SELECT lt.*, o.order_number FROM loyalty_transactions lt
       LEFT JOIN orders o ON lt.order_id = o.id
       WHERE lt.user_id = ?
       ORDER BY lt.created_at DESC
       LIMIT 20`,
      [req.user.id]
    );

    // Calculate tier
    const points = user[0].loyalty_points;
    let tier = "Bronze";
    let nextTier = 500;
    if (points >= 2000) { tier = "Platinum"; nextTier = null; }
    else if (points >= 1000) { tier = "Gold"; nextTier = 2000; }
    else if (points >= 500) { tier = "Silver"; nextTier = 1000; }

    res.json({
      success: true,
      data: {
        points,
        tier,
        nextTier,
        pointsToNextTier: nextTier ? nextTier - points : 0,
        redeemableValue: Math.floor(points / 10), // 10 points = ₹1
        transactions,
      },
    });
  } catch (err) {
    console.error("Get loyalty error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// POST /api/loyalty/redeem — redeem points as discount
router.post("/redeem", async (req, res) => {
  try {
    const { points } = req.body;
    if (!points || points < 100) {
      return res.status(400).json({ success: false, message: "Minimum 100 points to redeem." });
    }

    const [user] = await pool.query("SELECT loyalty_points FROM users WHERE id = ?", [req.user.id]);
    if (user[0].loyalty_points < points) {
      return res.status(400).json({ success: false, message: "Insufficient loyalty points." });
    }

    const discountValue = Math.floor(points / 10); // 10 points = ₹1

    // Deduct points
    await pool.query("UPDATE users SET loyalty_points = loyalty_points - ? WHERE id = ?", [points, req.user.id]);

    // Log transaction
    await pool.query(
      "INSERT INTO loyalty_transactions (user_id, points, type, description) VALUES (?, ?, 'redeemed', ?)",
      [req.user.id, -points, `Redeemed ${points} points for ₹${discountValue} discount`]
    );

    res.json({
      success: true,
      message: `Redeemed ${points} points for ₹${discountValue} discount!`,
      data: { discount: discountValue, pointsUsed: points },
    });
  } catch (err) {
    console.error("Redeem loyalty error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
