const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authenticate, requireStaff } = require("../middleware/auth");

router.use(authenticate, requireStaff);

// GET /api/analytics/overview — Dashboard overview stats
router.get("/overview", async (_req, res) => {
  try {
    // Revenue stats
    const [revenue] = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total ELSE 0 END), 0) as today_revenue,
        COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN total ELSE 0 END), 0) as week_revenue,
        COALESCE(SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN total ELSE 0 END), 0) as month_revenue,
        COALESCE(SUM(total), 0) as total_revenue
      FROM orders WHERE status != 'cancelled'
    `);

    // Order stats
    const [orderStats] = await pool.query(`
      SELECT
        COUNT(*) as total_orders,
        COALESCE(AVG(total), 0) as avg_order_value,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders
      FROM orders WHERE status != 'cancelled'
    `);

    // User stats
    const [userStats] = await pool.query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_signups,
        COUNT(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as week_signups
      FROM users WHERE role = 'user'
    `);

    // Product stats
    const [productStats] = await pool.query(`
      SELECT
        COUNT(*) as total_products,
        COUNT(CASE WHEN stock = 0 THEN 1 END) as out_of_stock,
        COUNT(CASE WHEN stock > 0 AND stock <= 10 THEN 1 END) as low_stock
      FROM products
    `);

    res.json({
      success: true,
      data: {
        revenue: {
          today: parseFloat(revenue[0].today_revenue),
          week: parseFloat(revenue[0].week_revenue),
          month: parseFloat(revenue[0].month_revenue),
          total: parseFloat(revenue[0].total_revenue),
        },
        orders: {
          total: orderStats[0].total_orders,
          avgValue: parseFloat(orderStats[0].avg_order_value).toFixed(2),
          today: orderStats[0].today_orders,
          pending: orderStats[0].pending_orders,
          delivered: orderStats[0].delivered_orders,
        },
        users: {
          total: userStats[0].total_users,
          todaySignups: userStats[0].today_signups,
          weekSignups: userStats[0].week_signups,
        },
        products: {
          total: productStats[0].total_products,
          outOfStock: productStats[0].out_of_stock,
          lowStock: productStats[0].low_stock,
        },
      },
    });
  } catch (err) {
    console.error("Analytics overview error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/analytics/top-products — Top 10 products by revenue
router.get("/top-products", async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT oi.product_name, SUM(oi.subtotal) as revenue, SUM(oi.quantity) as units_sold
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY oi.product_name
      ORDER BY revenue DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: rows.map((r) => ({
        name: r.product_name,
        revenue: parseFloat(r.revenue),
        unitsSold: r.units_sold,
      })),
    });
  } catch (err) {
    console.error("Top products error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/analytics/revenue-chart — Revenue over last 30 days
router.get("/revenue-chart", async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DATE(created_at) as date, COALESCE(SUM(total), 0) as revenue, COUNT(*) as orders
      FROM orders
      WHERE status != 'cancelled' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    res.json({
      success: true,
      data: rows.map((r) => ({
        date: r.date,
        revenue: parseFloat(r.revenue),
        orders: r.orders,
      })),
    });
  } catch (err) {
    console.error("Revenue chart error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/analytics/category-breakdown — Sales by category
router.get("/category-breakdown", async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.category, COALESCE(SUM(oi.subtotal), 0) as revenue, SUM(oi.quantity) as units_sold
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.status != 'cancelled'
      GROUP BY p.category
      ORDER BY revenue DESC
    `);

    res.json({
      success: true,
      data: rows.map((r) => ({
        category: r.category,
        revenue: parseFloat(r.revenue),
        unitsSold: r.units_sold,
      })),
    });
  } catch (err) {
    console.error("Category breakdown error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/analytics/restock-alerts — Products that need restocking
router.get("/restock-alerts", async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, name, category, stock, image
      FROM products
      WHERE stock <= 10
      ORDER BY stock ASC
      LIMIT 20
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Restock alerts error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/analytics/demand-forecast — Simple demand forecasting
router.get("/demand-forecast", async (_req, res) => {
  try {
    // Compare last 7 days vs previous 7 days
    const [rows] = await pool.query(`
      SELECT
        oi.product_name,
        oi.product_id,
        SUM(CASE WHEN o.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN oi.quantity ELSE 0 END) as recent_sales,
        SUM(CASE WHEN o.created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND o.created_at < DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN oi.quantity ELSE 0 END) as prev_sales
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled' AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
      GROUP BY oi.product_id, oi.product_name
      HAVING recent_sales > 0 OR prev_sales > 0
      ORDER BY recent_sales DESC
      LIMIT 15
    `);

    const forecast = rows.map((r) => {
      const trend = r.prev_sales > 0
        ? ((r.recent_sales - r.prev_sales) / r.prev_sales * 100).toFixed(1)
        : r.recent_sales > 0 ? 100 : 0;
      return {
        name: r.product_name,
        productId: r.product_id,
        recentSales: r.recent_sales,
        prevSales: r.prev_sales,
        trendPercent: parseFloat(trend),
        direction: parseFloat(trend) > 0 ? "up" : parseFloat(trend) < 0 ? "down" : "stable",
      };
    });

    res.json({ success: true, data: forecast });
  } catch (err) {
    console.error("Demand forecast error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
