# 🛒 Vegetable Market AI — Premium Grocery Delivery

![Vegetable Market AI Banner](https://via.placeholder.com/1200x400/0a0f16/00ff88?text=Vegetable+Market+AI+-+Premium+Grocery+Delivery)

Vegetable Market AI is a full-stack, state-of-the-art e-commerce web application inspired by "Quick Commerce" platforms like Blinkit and Zepto. It features a hyper-modern "Glassmorphism" UI, dynamic 3D particle backgrounds, and a robust Node.js/MySQL backend capable of handling production-scale traffic, real-time inventory, and secure role-based administration.

---

## ✨ Premium Features

### 🎨 Frontend (Blinkit-Class UI)
- **Progressive Web App (PWA):** Fully installable on mobile/desktop with service worker offline caching and custom manifest.
- **Glassmorphism & Neon Design:** Deep dark theme (`#0a0f16`) layered with frosted glass panels (`backdrop-filter`), with a seamless Light Mode toggle.
- **Interactive 3D Environment:** A custom `three.js` particle system with parallax scrolling and mouse-follow interactions.
- **AI Chatbot Assistant:** Floating chat widget answering product queries, tracking orders, and providing discount codes.
- **Real-Time Order Tracking:** Socket.IO integration provides live timeline updates without refreshing the page.
- **Micro-Animations:** Fluid GSAP entry animations, `VanillaTilt` 3D product cards, and confetti celebrations.
- **Slide-In Cart Drawer:** Manage cart quantities, view delivery estimates, and apply promo codes directly.
- **Loyalty & Rewards:** Earn points on every purchase and redeem them for discounts. Includes a visually rich rewards tier system.

### ⚙️ Backend (Production-Ready)
- **Admin Analytics Dashboard:** Powered by Chart.js, visualizing revenue trends, category breakdowns, and restock alerts.
- **Real-Time Notifications:** Socket.IO pushes live order alerts to the admin panel instantly.
- **Role-Based Access Control (RBAC):** Three distinct roles: `user` (shoppers), `employee` (staff managers), and `admin` (god-mode).
- **Transactional Inventory Management:** Strict row-level locking (`FOR UPDATE`) prevents overselling of stock during concurrent checkouts.
- **Subscriptions Engine:** Users can schedule recurring daily, weekly, or monthly deliveries of essential items.
- **Product Reviews & Ratings:** Verified purchasers can leave star ratings and reviews, which dynamically affect product rankings.
- **AI Recommendations:** "Frequently Bought Together" bundles and price-trend analysis endpoints.
- **Security Middleware:** Hardened with `helmet`, rate-limiting, and parameterized SQL queries.

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML5, CSS3, Vanilla JS, Three.js, GSAP, Chart.js.
- **Backend:** Node.js, Express.js, Socket.IO.
- **Database:** MySQL 8.0 (using `mysql2/promise` with connection pooling).
- **Authentication:** JWT (JSON Web Tokens) with `bcryptjs` password hashing.
- **Deployment:** Docker & Docker Compose configured for multi-container orchestration.

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MySQL](https://www.mysql.com/) (v8+) or Docker
- [Docker Compose](https://docs.docker.com/compose/) (Optional, for containerized deployment)

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
# Server
PORT=3000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=vegetable_market

# Security
JWT_SECRET=your_super_secret_jwt_key_here
```

### 3. Database Initialization & Seeding
Start your MySQL server and run the seed script to automatically create tables, populate the 50+ item catalog, and generate default accounts:
```bash
npm install
npm run seed
```
**Default Accounts Created:**
- **Admin:** `admin@freshcart.com` / `admin123`
- **Employee:** `employee@freshcart.com` / `emp123`
- **User:** `user@freshcart.com` / `user123`

### 4. Running Locally
Start the development server:
```bash
npm run dev
```
- **Storefront:** `http://localhost:3000`
- **Admin Dashboard:** `http://localhost:3000/admin.html`

### 5. Running with Docker (Production)
To deploy the entire stack (App + MySQL Database) via Docker:
```bash
docker-compose up -d --build
```

---

## 📂 Project Structure
```
d:\demo1\
├── config/
│   ├── db.js          # MySQL connection pool
│   ├── schema.sql     # Database table definitions
│   └── seed.js        # Catalog, coupons, and user seed script
├── middleware/
│   └── auth.js        # JWT validation and RBAC logic
├── routes/
│   ├── auth.js            # Login, Register
│   ├── products.js        # CRUD, Trending, Deals endpoints
│   ├── cart.js            # Cart management
│   ├── orders.js          # Transactional checkout and Socket.IO events
│   ├── wishlist.js        # User wishlists
│   ├── coupons.js         # Promo codes
│   ├── uploads.js         # Multer image uploads
│   ├── analytics.js       # Admin Chart.js data endpoints
│   ├── loyalty.js         # Rewards points logic
│   ├── subscriptions.js   # Recurring orders
│   └── reviews.js         # Product reviews
├── public/            # Frontend Assets
│   ├── index.html     # Main Storefront
│   ├── admin.html     # Admin Dashboard
│   ├── css/           # style.css, admin.css
│   └── js/            # app.js, admin.js, three-scene.js, ux-effects.js
├── server.js          # Express app entry point
├── Dockerfile         # Node.js app container definition
└── docker-compose.yml # Orchestration configuration
```

---

*Built with ❤️ for a modern web experience.*
