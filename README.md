# 🛒 Vegetable Market AI — Premium Grocery Delivery

![Vegetable Market AI Banner](https://via.placeholder.com/1200x400/0a0f16/00ff88?text=Vegetable+Market+AI+-+Premium+Grocery+Delivery)

Vegetable Market AI is a full-stack, state-of-the-art e-commerce web application inspired by "Quick Commerce" platforms like Blinkit and Zepto. It features a hyper-modern "Glassmorphism" UI, dynamic 3D particle backgrounds, and a robust Node.js/MySQL backend capable of handling production-scale traffic, real-time inventory, and secure role-based administration.

---

## ✨ Premium Features

### 🎨 Frontend (Blinkit-Class UI)
- **Glassmorphism & Neon Design:** Deep dark theme (`#0a0f16`) layered with frosted glass panels (`backdrop-filter`) and vibrant neon accents (Green, Purple, Gold).
- **Interactive 3D Environment:** A custom `three.js` particle system with parallax scrolling and mouse-follow interactions.
- **Micro-Animations:** Fluid GSAP entry animations, `VanillaTilt` 3D product cards, and confetti celebrations upon successful checkout.
- **Slide-In Cart Drawer:** Manage cart quantities, view delivery estimates, and apply promo codes directly without leaving the page.
- **Advanced Navigation:** Global search with instant dropdown previews, category visual grids, and horizontal flash-deal scrolls.
- **User Wishlist:** Save items for later with persistent database tracking.

### ⚙️ Backend (Production-Ready)
- **Role-Based Access Control (RBAC):** Three distinct roles: `user` (shoppers), `employee` (staff managers), and `admin` (god-mode).
- **Transactional Inventory Management:** Strict row-level locking (`FOR UPDATE`) prevents overselling of stock during concurrent checkouts.
- **Promotions Engine:** Full coupon code support with percentage/fixed discounts and minimum order validation.
- **Secure File Uploads:** Integrated `multer` for secure, on-premise product image uploads from the admin dashboard.
- **Security Middleware:** Hardened with `helmet`, rate-limiting, and parameterized SQL queries to prevent injections.

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML5, CSS3 (Custom Variables, CSS Grid/Flexbox), Vanilla JS, Three.js, GSAP.
- **Backend:** Node.js, Express.js.
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
- **Admin:** `admin@market.com` / `admin123`
- **Employee:** `staff@market.com` / `staff123`
- **User:** `user@market.com` / `user123`

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
│   ├── auth.js        # Login, Register
│   ├── products.js    # CRUD, Trending, Deals endpoints
│   ├── cart.js        # Cart management
│   ├── orders.js      # Transactional checkout and order tracking
│   ├── wishlist.js    # User wishlists
│   ├── coupons.js     # Promo code validation and admin CRUD
│   └── uploads.js     # Multer image uploads
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
