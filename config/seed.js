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

    console.log("\n🎉 Seed completed successfully!\n");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
