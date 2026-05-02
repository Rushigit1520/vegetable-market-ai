const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authenticate, requireStaff } = require("../middleware/auth");

// POST /api/orders — place order (user)
router.post("/", authenticate, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { address, phone, coupon_code } = req.body;

    if (!address) {
      return res.status(400).json({ success: false, message: "Delivery address is required." });
    }

    // Get cart items and lock related products for update
    const [cartItems] = await connection.query(
      `SELECT c.product_id, c.quantity, p.name, p.price, p.stock
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ? FOR UPDATE`,
      [req.user.id]
    );

    if (cartItems.length === 0) {
      connection.release();
      return res.status(400).json({ success: false, message: "Cart is empty." });
    }

    // Calculate total and verify stock
    let subtotal = 0;
    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        connection.release();
        return res.status(400).json({ success: false, message: `Insufficient stock for product: ${item.name}` });
      }
      subtotal += parseFloat(item.price) * item.quantity;
    }

    // Apply coupon discount
    let discount = 0;
    let appliedCoupon = null;
    if (coupon_code) {
      const [coupons] = await connection.query(
        "SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND (uses_remaining = -1 OR uses_remaining > 0) AND (expires_at IS NULL OR expires_at > NOW())",
        [coupon_code.toUpperCase()]
      );
      if (coupons.length > 0) {
        const coupon = coupons[0];
        if (subtotal >= parseFloat(coupon.min_order)) {
          if (coupon.discount_type === "percentage") {
            discount = (subtotal * parseFloat(coupon.discount_value)) / 100;
            if (coupon.max_discount && discount > parseFloat(coupon.max_discount)) {
              discount = parseFloat(coupon.max_discount);
            }
          } else {
            discount = parseFloat(coupon.discount_value);
          }
          appliedCoupon = coupon.code;

          // Decrement uses if not unlimited
          if (coupon.uses_remaining > 0) {
            await connection.query("UPDATE coupons SET uses_remaining = uses_remaining - 1 WHERE id = ?", [coupon.id]);
          }
        }
      }
    }

    const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);
    const orderNumber = `VM-${Date.now().toString(36).toUpperCase()}`;

    // Start transaction
    await connection.beginTransaction();

    // Insert order
    const [orderResult] = await connection.query(
      "INSERT INTO orders (user_id, order_number, total, discount, coupon_code, status, address, phone) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)",
      [req.user.id, orderNumber, total, Math.round(discount * 100) / 100, appliedCoupon, address, phone || ""]
    );

    const orderId = orderResult.insertId;

    // Insert order items
    const orderItemValues = cartItems.map((item) => [
      orderId,
      item.product_id,
      item.name,
      item.price,
      item.quantity,
      Math.round(parseFloat(item.price) * item.quantity * 100) / 100,
    ]);

    await connection.query(
      "INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal) VALUES ?",
      [orderItemValues]
    );

    // Decrement stock for each product
    for (const item of cartItems) {
      await connection.query(
        "UPDATE products SET stock = stock - ? WHERE id = ?",
        [item.quantity, item.product_id]
      );
    }

    // Clear cart
    await connection.query("DELETE FROM cart WHERE user_id = ?", [req.user.id]);

    await connection.commit();

    // Fetch the complete order
    const [order] = await connection.query("SELECT * FROM orders WHERE id = ?", [orderId]);
    const [items] = await connection.query("SELECT * FROM order_items WHERE order_id = ?", [orderId]);

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      data: {
        ...order[0],
        total: parseFloat(order[0].total),
        discount: parseFloat(order[0].discount),
        items: items.map((i) => ({
          ...i,
          price: parseFloat(i.price),
          subtotal: parseFloat(i.subtotal),
        })),
      },
    });
  } catch (err) {
    await connection.rollback();
    console.error("Place order error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  } finally {
    connection.release();
  }
});

// GET /api/orders — get user's order history
router.get("/", authenticate, async (req, res) => {
  try {
    const [orders] = await pool.query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );

    // Fetch items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [items] = await pool.query(
          "SELECT * FROM order_items WHERE order_id = ?",
          [order.id]
        );
        return {
          ...order,
          total: parseFloat(order.total),
          discount: parseFloat(order.discount || 0),
          items: items.map((i) => ({
            ...i,
            price: parseFloat(i.price),
            subtotal: parseFloat(i.subtotal),
          })),
        };
      })
    );

    res.json({ success: true, data: ordersWithItems });
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ============ ADMIN ROUTES (BEFORE /:id to avoid route conflicts) ============

// GET /api/orders/admin/all — view all orders (staff)
router.get("/admin/all", authenticate, requireStaff, async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, u.name as user_name, u.email as user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [items] = await pool.query(
          "SELECT * FROM order_items WHERE order_id = ?",
          [order.id]
        );
        return {
          ...order,
          total: parseFloat(order.total),
          discount: parseFloat(order.discount || 0),
          items: items.map((i) => ({
            ...i,
            price: parseFloat(i.price),
            subtotal: parseFloat(i.subtotal),
          })),
        };
      })
    );

    res.json({ success: true, data: ordersWithItems });
  } catch (err) {
    console.error("Get all orders error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// PUT /api/orders/admin/:id/status — update order status (staff)
router.put("/admin/:id/status", authenticate, requireStaff, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const [existing] = await pool.query("SELECT * FROM orders WHERE id = ?", [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    await pool.query("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id]);

    res.json({ success: true, message: `Order status updated to ${status}.` });
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/orders/:id — get single order (AFTER admin routes to avoid conflicts)
router.get("/:id", authenticate, async (req, res) => {
  try {
    const [orders] = await pool.query(
      "SELECT * FROM orders WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const [items] = await pool.query(
      "SELECT * FROM order_items WHERE order_id = ?",
      [orders[0].id]
    );

    res.json({
      success: true,
      data: {
        ...orders[0],
        total: parseFloat(orders[0].total),
        discount: parseFloat(orders[0].discount || 0),
        items: items.map((i) => ({
          ...i,
          price: parseFloat(i.price),
          subtotal: parseFloat(i.subtotal),
        })),
      },
    });
  } catch (err) {
    console.error("Get order error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
