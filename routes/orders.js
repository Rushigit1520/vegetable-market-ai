const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const products = require("../data/products.js");
const cartRouter = require("./cart.js");

// In-memory orders store
const orders = [];

// POST /api/orders — place order
router.post("/", (req, res) => {
  const { customer } = req.body;

  if (!customer || !customer.name || !customer.email || !customer.address) {
    return res.status(400).json({ success: false, message: "Customer name, email, and address are required" });
  }

  const cartItems = cartRouter.getCart();
  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ success: false, message: "Cart is empty" });
  }

  const enrichedItems = cartItems.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return {
      productId: item.productId,
      name: product ? product.name : "Unknown",
      price: product ? product.price : 0,
      quantity: item.quantity,
      subtotal: product ? Math.round(product.price * item.quantity * 100) / 100 : 0
    };
  });

  const total = enrichedItems.reduce((sum, item) => sum + item.subtotal, 0);

  const order = {
    id: uuidv4(),
    orderNumber: `FC-${Date.now().toString(36).toUpperCase()}`,
    customer,
    items: enrichedItems,
    total: Math.round(total * 100) / 100,
    status: "confirmed",
    createdAt: new Date().toISOString()
  };

  orders.push(order);
  cartRouter.clearCart();

  res.status(201).json({ success: true, message: "Order placed successfully!", data: order });
});

// GET /api/orders
router.get("/", (_req, res) => {
  res.json({ success: true, data: orders });
});

// GET /api/orders/:id
router.get("/:id", (req, res) => {
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });
  res.json({ success: true, data: order });
});

module.exports = router;
