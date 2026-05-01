const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");

// All cart routes require authentication
router.use(authenticate);

// GET /api/cart — get user's cart
router.get("/", async (req, res) => {
  try {
    const [items] = await pool.query(
      `SELECT c.id, c.product_id, c.quantity,
              p.name, p.category, p.price, p.unit, p.image, p.stock
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [req.user.id]
    );

    const enriched = items.map((item) => ({
      productId: item.product_id,
      quantity: item.quantity,
      product: {
        id: item.product_id,
        name: item.name,
        category: item.category,
        price: parseFloat(item.price),
        unit: item.unit,
        image: item.image,
        inStock: item.stock,
      },
    }));

    const total = enriched.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    res.json({
      success: true,
      data: {
        items: enriched,
        total: Math.round(total * 100) / 100,
        itemCount: enriched.reduce((s, i) => s + i.quantity, 0),
      },
    });
  } catch (err) {
    console.error("Get cart error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// POST /api/cart — add item { productId, quantity }
router.post("/", async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: "productId is required." });
    }

    // Check product exists and has enough stock
    const [products] = await pool.query("SELECT id, stock, name FROM products WHERE id = ?", [productId]);
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const product = products[0];

    // Check current quantity in cart
    const [currentCart] = await pool.query("SELECT quantity FROM cart WHERE user_id = ? AND product_id = ?", [req.user.id, productId]);
    const currentQty = currentCart.length > 0 ? currentCart[0].quantity : 0;
    
    if (currentQty + quantity > product.stock) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} units of ${product.name} are available.` });
    }

    // Upsert — add or increment quantity
    await pool.query(
      `INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
      [req.user.id, productId, quantity, quantity]
    );

    const [updated] = await pool.query(
      "SELECT quantity FROM cart WHERE user_id = ? AND product_id = ?",
      [req.user.id, productId]
    );

    res.json({
      success: true,
      message: "Item added to cart",
      data: { productId, quantity: updated[0].quantity },
    });
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// PUT /api/cart/:productId — update quantity { quantity }
router.put("/:productId", async (req, res) => {
  try {
    const { quantity } = req.body;
    const productId = req.params.productId;

    const [existing] = await pool.query(
      "SELECT id FROM cart WHERE user_id = ? AND product_id = ?",
      [req.user.id, productId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Item not in cart." });
    }

    if (quantity <= 0) {
      await pool.query(
        "DELETE FROM cart WHERE user_id = ? AND product_id = ?",
        [req.user.id, productId]
      );
      return res.json({ success: true, message: "Item removed from cart" });
    }

    // Check stock
    const [products] = await pool.query("SELECT stock, name FROM products WHERE id = ?", [productId]);
    if (products.length > 0 && quantity > products[0].stock) {
      return res.status(400).json({ success: false, message: `Only ${products[0].stock} units of ${products[0].name} are available.` });
    }

    await pool.query(
      "UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?",
      [quantity, req.user.id, productId]
    );
    res.json({ success: true, message: "Cart updated", data: { productId, quantity } });
  } catch (err) {
    console.error("Update cart error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// DELETE /api/cart/:productId — remove single item
router.delete("/:productId", async (req, res) => {
  try {
    const [existing] = await pool.query(
      "SELECT id FROM cart WHERE user_id = ? AND product_id = ?",
      [req.user.id, req.params.productId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Item not in cart." });
    }

    await pool.query(
      "DELETE FROM cart WHERE user_id = ? AND product_id = ?",
      [req.user.id, req.params.productId]
    );
    res.json({ success: true, message: "Item removed from cart" });
  } catch (err) {
    console.error("Remove from cart error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// DELETE /api/cart — clear entire cart
router.delete("/", async (req, res) => {
  try {
    await pool.query("DELETE FROM cart WHERE user_id = ?", [req.user.id]);
    res.json({ success: true, message: "Cart cleared" });
  } catch (err) {
    console.error("Clear cart error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
