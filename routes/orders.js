const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authenticate, requireStaff } = require("../middleware/auth");

// POST /api/orders — place order (user)
router.post("/", authenticate, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { address, phone, coupon_code, payment_method } = req.body;

    if (!address) {
      return res.status(400).json({ success: false, message: "Delivery address is required." });
    }

    const [cartItems] = await connection.query(
      `SELECT c.product_id, c.quantity, p.name, p.price, p.stock
       FROM cart c JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ? FOR UPDATE`,
      [req.user.id]
    );

    if (cartItems.length === 0) {
      connection.release();
      return res.status(400).json({ success: false, message: "Cart is empty." });
    }

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
          if (coupon.uses_remaining > 0) {
            await connection.query("UPDATE coupons SET uses_remaining = uses_remaining - 1 WHERE id = ?", [coupon.id]);
          }
        }
      }
    }

    const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);
    const orderNumber = `VM-${Date.now().toString(36).toUpperCase()}`;

    // Calculate loyalty points earned (1 point per ₹10 spent)
    const loyaltyEarned = Math.floor(total / 10);

    await connection.beginTransaction();

    const [orderResult] = await connection.query(
      "INSERT INTO orders (user_id, order_number, total, discount, coupon_code, status, payment_method, address, phone, loyalty_earned) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)",
      [req.user.id, orderNumber, total, Math.round(discount * 100) / 100, appliedCoupon, payment_method || "cod", address, phone || "", loyaltyEarned]
    );

    const orderId = orderResult.insertId;

    const orderItemValues = cartItems.map((item) => [
      orderId, item.product_id, item.name, item.price, item.quantity,
      Math.round(parseFloat(item.price) * item.quantity * 100) / 100,
    ]);

    await connection.query(
      "INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal) VALUES ?",
      [orderItemValues]
    );

    for (const item of cartItems) {
      await connection.query("UPDATE products SET stock = stock - ? WHERE id = ?", [item.quantity, item.product_id]);
    }

    // Award loyalty points
    if (loyaltyEarned > 0) {
      await connection.query("UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?", [loyaltyEarned, req.user.id]);
      await connection.query(
        "INSERT INTO loyalty_transactions (user_id, points, type, description, order_id) VALUES (?, ?, 'earned', ?, ?)",
        [req.user.id, loyaltyEarned, `Earned ${loyaltyEarned} points for order ${orderNumber}`, orderId]
      );
    }

    // Record price history snapshot
    for (const item of cartItems) {
      await connection.query(
        "INSERT IGNORE INTO price_history (product_id, price) SELECT id, price FROM products WHERE id = ?",
        [item.product_id]
      );
    }

    await connection.query("DELETE FROM cart WHERE user_id = ?", [req.user.id]);
    await connection.commit();

    const [order] = await connection.query("SELECT * FROM orders WHERE id = ?", [orderId]);
    const [items] = await connection.query("SELECT * FROM order_items WHERE order_id = ?", [orderId]);

    // Emit real-time event
    const io = req.app.get("io");
    if (io) {
      io.to("admin_room").emit("new_order", { orderNumber, total, userId: req.user.id });
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      data: {
        ...order[0],
        total: parseFloat(order[0].total),
        discount: parseFloat(order[0].discount),
        loyaltyEarned,
        items: items.map((i) => ({ ...i, price: parseFloat(i.price), subtotal: parseFloat(i.subtotal) })),
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

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [items] = await pool.query("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
        return {
          ...order,
          total: parseFloat(order.total),
          discount: parseFloat(order.discount || 0),
          items: items.map((i) => ({ ...i, price: parseFloat(i.price), subtotal: parseFloat(i.subtotal) })),
        };
      })
    );

    res.json({ success: true, data: ordersWithItems });
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// POST /api/orders/:id/reorder — re-order from past order
router.post("/:id/reorder", authenticate, async (req, res) => {
  try {
    const [orders] = await pool.query("SELECT * FROM orders WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    if (orders.length === 0) return res.status(404).json({ success: false, message: "Order not found." });

    const [items] = await pool.query("SELECT * FROM order_items WHERE order_id = ?", [req.params.id]);

    // Clear current cart and add all items
    await pool.query("DELETE FROM cart WHERE user_id = ?", [req.user.id]);

    for (const item of items) {
      if (item.product_id) {
        const [prod] = await pool.query("SELECT stock FROM products WHERE id = ?", [item.product_id]);
        if (prod.length > 0 && prod[0].stock > 0) {
          const qty = Math.min(item.quantity, prod[0].stock);
          await pool.query(
            "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = ?",
            [req.user.id, item.product_id, qty, qty]
          );
        }
      }
    }

    res.json({ success: true, message: "Items added to cart from previous order!" });
  } catch (err) {
    console.error("Reorder error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ============ ADMIN ROUTES ============

// GET /api/orders/admin/all — view all orders (staff)
router.get("/admin/all", authenticate, requireStaff, async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, u.name as user_name, u.email as user_email
       FROM orders o JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [items] = await pool.query("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
        return {
          ...order,
          total: parseFloat(order.total),
          discount: parseFloat(order.discount || 0),
          items: items.map((i) => ({ ...i, price: parseFloat(i.price), subtotal: parseFloat(i.subtotal) })),
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
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const [existing] = await pool.query("SELECT * FROM orders WHERE id = ?", [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: "Order not found." });

    await pool.query("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id]);

    // Emit real-time status update to the user
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${existing[0].user_id}`).emit("order_status_update", {
        orderId: existing[0].id,
        orderNumber: existing[0].order_number,
        status,
      });
    }

    res.json({ success: true, message: `Order status updated to ${status}.` });
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/orders/:id — get single order
router.get("/:id", authenticate, async (req, res) => {
  try {
    const [orders] = await pool.query("SELECT * FROM orders WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    if (orders.length === 0) return res.status(404).json({ success: false, message: "Order not found." });

    const [items] = await pool.query("SELECT * FROM order_items WHERE order_id = ?", [orders[0].id]);

    res.json({
      success: true,
      data: {
        ...orders[0],
        total: parseFloat(orders[0].total),
        discount: parseFloat(orders[0].discount || 0),
        items: items.map((i) => ({ ...i, price: parseFloat(i.price), subtotal: parseFloat(i.subtotal) })),
      },
    });
  } catch (err) {
    console.error("Get order error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
