const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.get("/", async (req, res) => {
  try {
    const [subs] = await pool.query(
      `SELECT s.*, p.name, p.price, p.unit, p.image, p.category
       FROM subscriptions s JOIN products p ON s.product_id = p.id
       WHERE s.user_id = ? ORDER BY s.next_delivery ASC`,
      [req.user.id]
    );
    res.json({ success: true, data: subs.map(s => ({ ...s, price: parseFloat(s.price) })) });
  } catch (err) {
    console.error("Get subscriptions error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { productId, quantity, frequency, address, phone } = req.body;
    if (!productId || !frequency || !address) {
      return res.status(400).json({ success: false, message: "Product ID, frequency, and address are required." });
    }
    const validFreqs = ["daily", "weekly", "biweekly", "monthly"];
    if (!validFreqs.includes(frequency)) {
      return res.status(400).json({ success: false, message: "Invalid frequency." });
    }
    const [products] = await pool.query("SELECT id FROM products WHERE id = ?", [productId]);
    if (products.length === 0) return res.status(404).json({ success: false, message: "Product not found." });

    const nextDelivery = new Date();
    if (frequency === "daily") nextDelivery.setDate(nextDelivery.getDate() + 1);
    else if (frequency === "weekly") nextDelivery.setDate(nextDelivery.getDate() + 7);
    else if (frequency === "biweekly") nextDelivery.setDate(nextDelivery.getDate() + 14);
    else nextDelivery.setMonth(nextDelivery.getMonth() + 1);

    const [result] = await pool.query(
      `INSERT INTO subscriptions (user_id, product_id, quantity, frequency, address, phone, next_delivery) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, productId, quantity || 1, frequency, address, phone || "", nextDelivery.toISOString().split("T")[0]]
    );
    res.status(201).json({ success: true, message: "Subscription created!", data: { id: result.insertId } });
  } catch (err) {
    console.error("Create subscription error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

router.put("/:id/toggle", async (req, res) => {
  try {
    const [sub] = await pool.query("SELECT * FROM subscriptions WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    if (sub.length === 0) return res.status(404).json({ success: false, message: "Subscription not found." });
    const newStatus = !sub[0].is_active;
    await pool.query("UPDATE subscriptions SET is_active = ? WHERE id = ?", [newStatus ? 1 : 0, req.params.id]);
    res.json({ success: true, message: newStatus ? "Subscription resumed." : "Subscription paused." });
  } catch (err) {
    console.error("Toggle subscription error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM subscriptions WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Subscription not found." });
    res.json({ success: true, message: "Subscription cancelled." });
  } catch (err) {
    console.error("Cancel subscription error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
