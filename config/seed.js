/**
 * Seed Script — Creates database, tables, and inserts initial data
 * Run: node config/seed.js
 */
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const products = require("../data/products.js");

async function seed() {
  console.log("\n🌱 Starting database seed...\n");

  // Connect WITHOUT database first to create it
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });

  try {
    // Read and execute schema
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");
    await connection.query(schema);
    console.log("✅ Database reset and tables freshly created");

    // Use the database
    await connection.query(`USE ${process.env.DB_NAME || "vegetable_market"}`);

    // Insert products
    const productValues = products.map((p) => {
      const randomStock = Math.floor(Math.random() * 46) + 5; // 5 to 50
      return [
        p.name,
        p.category,
        p.price,
        p.original_price || null,
        p.unit,
        p.description,
        p.image,
        randomStock,
        p.rating,
        p.reviews,
        p.is_featured ? 1 : 0,
        p.is_deal ? 1 : 0,
      ];
    });

    await connection.query(
      `INSERT INTO products (name, category, price, original_price, unit, description, image, stock, rating, reviews, is_featured, is_deal) VALUES ?`,
      [productValues]
    );
    console.log(`✅ Inserted ${products.length} products with stock & deals`);

    // Create default admin
    const hashedAdminPw = await bcrypt.hash("admin123", 10);
    await connection.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      ["Admin", "admin@freshcart.com", hashedAdminPw, "admin"]
    );
    console.log("✅ Default admin created (admin@freshcart.com / admin123)");

    // Create default employee
    const hashedEmpPw = await bcrypt.hash("emp123", 10);
    await connection.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      ["Employee", "employee@freshcart.com", hashedEmpPw, "employee"]
    );
    console.log("✅ Default employee created (employee@freshcart.com / emp123)");

    // Seed coupons
    const coupons = [
      ["FRESH10", "10% off on your order", "percentage", 10, 200, 100, 1, -1, null],
      ["WELCOME20", "Flat ₹20 off for new users", "flat", 20, 100, null, 1, -1, null],
      ["FREESHIP", "Free delivery on any order", "flat", 49, 0, null, 1, -1, null],
      ["SUPER50", "Flat ₹50 off on orders above ₹500", "flat", 50, 500, null, 1, -1, null],
      ["MEGA25", "25% off up to ₹150", "percentage", 25, 300, 150, 1, -1, null],
    ];

    await connection.query(
      `INSERT INTO coupons (code, description, discount_type, discount_value, min_order, max_discount, is_active, uses_remaining, expires_at) VALUES ?`,
      [coupons]
    );
    console.log("✅ Seeded 5 coupon codes");

    // Create default user
    const hashedUserPw = await bcrypt.hash("user123", 10);
    const [userRes] = await connection.query(
      "INSERT INTO users (name, email, password, role, loyalty_points) VALUES (?, ?, ?, ?, ?)",
      ["Test User", "user@freshcart.com", hashedUserPw, "user", 500]
    );
    const userId = userRes.insertId;
    console.log("✅ Default user created (user@freshcart.com / user123) with 500 loyalty points");

    // Insert mock orders for analytics
    const pastDates = [1, 2, 5, 7, 10, 15, 20].map(d => new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    for (let i = 0; i < pastDates.length; i++) {
      const orderNum = `VM-TEST${i}`;
      const status = i === 0 ? "pending" : "delivered";
      const total = 100 + (i * 50);
      const [orderRes] = await connection.query(
        "INSERT INTO orders (user_id, order_number, total, status, address, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [userId, orderNum, total, status, "123 Test St", pastDates[i]]
      );
      
      // Mock order item (Product ID 1 - Bananas)
      await connection.query(
        "INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)",
        [orderRes.insertId, 1, "Organic Bananas", 49, 2, 98]
      );
    }
    console.log("✅ Seeded mock orders for analytics");

    // Seed Reviews
    await connection.query(
      "INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)",
      [userId, 1, 5, "These bananas are super fresh! Best I've had."]
    );
    console.log("✅ Seeded mock reviews");

    console.log("\n🎉 Seed completed successfully!\n");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
