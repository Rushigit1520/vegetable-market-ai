const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authenticate, requireStaff } = require("../middleware/auth");

// GET /api/products — list all, optionally filter by ?category=, ?search=, ?sortBy=, ?minPrice=, ?maxPrice=
router.get("/", async (req, res) => {
  try {
    const { category, search, sortBy, minPrice, maxPrice, deals, featured } = req.query;
    let query = "SELECT * FROM products";
    const params = [];
    const conditions = [];

    if (category && category !== "All") {
      conditions.push("LOWER(category) = LOWER(?)");
      params.push(category);
    }

    if (search) {
      conditions.push(
        "(LOWER(name) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?) OR LOWER(category) LIKE LOWER(?))"
      );
      const q = `%${search}%`;
      params.push(q, q, q);
    }

    if (minPrice) {
      conditions.push("price >= ?");
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      conditions.push("price <= ?");
      params.push(parseFloat(maxPrice));
    }

    if (deals === "true") {
      conditions.push("is_deal = 1 AND original_price IS NOT NULL");
    }

    if (featured === "true") {
      conditions.push("is_featured = 1");
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    // Sort options
    switch (sortBy) {
      case "price_asc":
        query += " ORDER BY price ASC";
        break;
      case "price_desc":
        query += " ORDER BY price DESC";
        break;
      case "rating":
        query += " ORDER BY rating DESC, reviews DESC";
        break;
      case "popularity":
        query += " ORDER BY reviews DESC, rating DESC";
        break;
      case "newest":
        query += " ORDER BY created_at DESC";
        break;
      default:
        query += " ORDER BY id ASC";
    }

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    console.error("Get products error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/products/categories — distinct category list
router.get("/categories", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT DISTINCT category FROM products ORDER BY category");
    const categories = rows.map((r) => r.category);
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error("Get categories error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/products/trending — top-rated products
router.get("/trending", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM products WHERE stock > 0 ORDER BY rating DESC, reviews DESC LIMIT 10"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Get trending error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/products/deals — products with discount
router.get("/deals", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM products WHERE is_deal = 1 AND original_price IS NOT NULL AND stock > 0 ORDER BY (original_price - price) DESC LIMIT 10"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Get deals error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/products/featured — featured products
router.get("/featured", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM products WHERE is_featured = 1 AND stock > 0 ORDER BY rating DESC LIMIT 12"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Get featured error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("Get product error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// POST /api/products — add product (staff only)
router.post("/", authenticate, requireStaff, async (req, res) => {
  try {
    const { name, category, price, original_price, unit, description, image, stock, is_featured, is_deal } = req.body;

    if (!name || !category || !price || !unit) {
      return res.status(400).json({ success: false, message: "Name, category, price, and unit are required." });
    }

    const numericStock = parseInt(stock) || 0;

    const [result] = await pool.query(
      "INSERT INTO products (name, category, price, original_price, unit, description, image, stock, is_featured, is_deal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [name, category, price, original_price || null, unit, description || "", image || "/assets/carrot.png", numericStock, is_featured ? 1 : 0, is_deal ? 1 : 0]
    );

    const [newProduct] = await pool.query("SELECT * FROM products WHERE id = ?", [result.insertId]);
    res.status(201).json({ success: true, message: "Product added!", data: newProduct[0] });
  } catch (err) {
    console.error("Add product error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// PUT /api/products/:id — update product (staff only)
router.put("/:id", authenticate, requireStaff, async (req, res) => {
  try {
    const { name, category, price, original_price, unit, description, image, stock, is_featured, is_deal } = req.body;

    const [existing] = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    await pool.query(
      `UPDATE products SET name = ?, category = ?, price = ?, original_price = ?, unit = ?, description = ?, image = ?, stock = ?, is_featured = ?, is_deal = ? WHERE id = ?`,
      [
        name || existing[0].name,
        category || existing[0].category,
        price !== undefined ? price : existing[0].price,
        original_price !== undefined ? original_price : existing[0].original_price,
        unit || existing[0].unit,
        description !== undefined ? description : existing[0].description,
        image || existing[0].image,
        stock !== undefined ? parseInt(stock) : existing[0].stock,
        is_featured !== undefined ? (is_featured ? 1 : 0) : existing[0].is_featured,
        is_deal !== undefined ? (is_deal ? 1 : 0) : existing[0].is_deal,
        req.params.id,
      ]
    );

    const [updated] = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Product updated!", data: updated[0] });
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// DELETE /api/products/:id — delete product (staff only)
router.delete("/:id", authenticate, requireStaff, async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM products WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }
    res.json({ success: true, message: "Product deleted successfully." });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
