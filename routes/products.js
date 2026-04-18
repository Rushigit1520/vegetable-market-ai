const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authenticate, requireStaff } = require("../middleware/auth");

// GET /api/products — list all, optionally filter by ?category= or ?search=
router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;
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

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY id ASC";

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
    const { name, category, price, unit, description, image, stock } = req.body;

    if (!name || !category || !price || !unit) {
      return res.status(400).json({ success: false, message: "Name, category, price, and unit are required." });
    }

    const numericStock = parseInt(stock) || 0;

    const [result] = await pool.query(
      "INSERT INTO products (name, category, price, unit, description, image, stock) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, category, price, unit, description || "", image || "🥬", numericStock]
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
    const { name, category, price, unit, description, image, stock } = req.body;

    const [existing] = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    await pool.query(
      `UPDATE products SET name = ?, category = ?, price = ?, unit = ?, description = ?, image = ?, stock = ? WHERE id = ?`,
      [
        name || existing[0].name,
        category || existing[0].category,
        price !== undefined ? price : existing[0].price,
        unit || existing[0].unit,
        description !== undefined ? description : existing[0].description,
        image || existing[0].image,
        stock !== undefined ? parseInt(stock) : existing[0].stock,
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
