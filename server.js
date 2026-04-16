const express = require("express");
const cors = require("cors");
const path = require("path");

const productRoutes = require("./routes/products.js");
const cartRoutes = require("./routes/cart.js");
const orderRoutes = require("./routes/orders.js");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// SPA fallback — serve index.html for all non-API routes
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n  🛒  FreshCart Grocery is running!\n`);
  console.log(`  ➜  Local:   http://localhost:${PORT}`);
  console.log(`  ➜  API:     http://localhost:${PORT}/api/products\n`);
});
