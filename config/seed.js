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

    // Insert products (Randomizing Stock from 5 to 50 instead of boolean)
    const productValues = products.map((p) => {
      const randomStock = Math.floor(Math.random() * 46) + 5; // Yields 5 to 50
      return [
        p.name,
        p.category,
        p.price,
        p.unit,
        p.description,
        p.image,
        randomStock,
        p.rating,
        p.reviews,
      ];
    });

    await connection.query(
      `INSERT INTO products (name, category, price, unit, description, image, stock, rating, reviews) VALUES ?`,
      [productValues]
    );
    console.log(`✅ Inserted ${products.length} products with generated stock logic`);

    // Create default admin
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await connection.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      ["Admin", "admin@freshcart.com", hashedPassword, "admin"]
    );
    console.log("✅ Default root admin created (admin@freshcart.com / admin123)");

    console.log("\n🎉 Seed completed successfully!\n");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
