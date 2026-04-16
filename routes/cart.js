const express = require("express");
const router = express.Router();
const products = require("../data/products.js");

// In-memory cart store (keyed by session — for demo we use a single cart)
let cart = [];

// GET /api/cart
router.get("/", (_req, res) => {
  const enriched = cart.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return { ...item, product };
  });
  const total = enriched.reduce(
    (sum, item) => sum + (item.product ? item.product.price * item.quantity : 0),
    0
  );
  res.json({ success: true, data: { items: enriched, total: Math.round(total * 100) / 100, itemCount: enriched.reduce((s, i) => s + i.quantity, 0) } });
});

// POST /api/cart — add item { productId, quantity }
router.post("/", (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ success: false, message: "productId is required" });

  const product = products.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });

  const existing = cart.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }

  res.json({ success: true, message: "Item added to cart", data: { productId, quantity: existing ? existing.quantity : quantity } });
});

// PUT /api/cart/:productId — update quantity { quantity }
router.put("/:productId", (req, res) => {
  const { quantity } = req.body;
  const idx = cart.findIndex((i) => i.productId === req.params.productId);
  if (idx === -1) return res.status(404).json({ success: false, message: "Item not in cart" });

  if (quantity <= 0) {
    cart.splice(idx, 1);
    return res.json({ success: true, message: "Item removed from cart" });
  }

  cart[idx].quantity = quantity;
  res.json({ success: true, message: "Cart updated", data: cart[idx] });
});

// DELETE /api/cart/:productId
router.delete("/:productId", (req, res) => {
  const idx = cart.findIndex((i) => i.productId === req.params.productId);
  if (idx === -1) return res.status(404).json({ success: false, message: "Item not in cart" });
  cart.splice(idx, 1);
  res.json({ success: true, message: "Item removed from cart" });
});

// DELETE /api/cart — clear cart
router.delete("/", (_req, res) => {
  cart = [];
  res.json({ success: true, message: "Cart cleared" });
});

// Export cart ref for orders
router.getCart = () => cart;
router.clearCart = () => { cart = []; };

module.exports = router;
