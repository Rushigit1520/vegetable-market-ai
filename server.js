require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const http = require("http");
const logger = require("./utils/logger");
const pool = require("./config/db");

// Ensure logs directory exists
const fs = require("fs");
const logDir = path.join(__dirname, "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const authRoutes = require("./routes/auth.js");
const productRoutes = require("./routes/products.js");
const cartRoutes = require("./routes/cart.js");
const orderRoutes = require("./routes/orders.js");
const recommendationRoutes = require("./routes/recommendations.js");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// ---------- Socket.IO Setup ----------
let io;
try {
  const { Server } = require("socket.io");
  io = new Server(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    // Join user-specific room for targeted updates
    socket.on("join", (userId) => {
      if (userId) socket.join(`user_${userId}`);
    });
    socket.on("join_admin", () => {
      socket.join("admin_room");
    });
  });

  // Make io accessible to routes
  app.set("io", io);
  logger.info("✅ Socket.IO initialized");
} catch (err) {
  logger.warn("Socket.IO not available, real-time features disabled");
}

// ---------- Security Middleware ----------
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow inline scripts & CDN assets
    crossOriginEmbedderPolicy: false,
  })
);

app.set('trust proxy', 1);

// Rate limiting — 100 req/min per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please slow down." },
});
app.use("/api/", apiLimiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { success: false, message: "Too many auth attempts. Try again later." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ---------- Core Middleware ----------
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(morgan("tiny", { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// ---------- API Routes ----------
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/wishlist", require("./routes/wishlist.js"));
app.use("/api/coupons", require("./routes/coupons.js"));
app.use("/api/uploads", require("./routes/uploads.js"));
app.use("/api/reviews", require("./routes/reviews.js"));
app.use("/api/analytics", require("./routes/analytics.js"));
app.use("/api/loyalty", require("./routes/loyalty.js"));
app.use("/api/subscriptions", require("./routes/subscriptions.js"));

// Health check with extended metrics
app.get("/api/health", (_req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: {
      heapUsedMB: (mem.heapUsed / 1024 / 1024).toFixed(2),
      rssMB: (mem.rss / 1024 / 1024).toFixed(2),
    },
    version: require("./package.json").version,
  });
});

// SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ---------- Global Error Handler ----------
app.use((err, _req, res, _next) => {
  logger.error("Unhandled error:", { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, message: "Internal server error" });
});

// ---------- Start ----------
async function startServer() {
  try {
    // Check DB connection before starting server
    const connection = await pool.getConnection();
    logger.info("✅ Database connected successfully");
    connection.release();

    server.listen(PORT, () => {
      logger.info(`🛒 Vegetable Market AI is running on port ${PORT}`);
      console.log(`\n  🛒  Vegetable Market AI v3.0 is running!\n`);
      console.log(`  ➜  Local:      http://localhost:${PORT}`);
      console.log(`  ➜  API:        http://localhost:${PORT}/api/products`);
      console.log(`  ➜  Admin:      http://localhost:${PORT}/admin.html`);
      console.log(`  ➜  Health:     http://localhost:${PORT}/api/health`);
      console.log(`  ➜  WebSocket:  ws://localhost:${PORT}\n`);
    });
  } catch (err) {
    logger.error("❌ Failed to connect to database on startup:", err);
    console.error("\n❌ Database Connection Failed. Make sure MySQL is running and credentials are correct in .env\n");
    process.exit(1);
  }
}

startServer();
