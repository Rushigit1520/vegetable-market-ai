# 🥬 Vegetable Market AI — High-Fidelity 3D Storefront

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

![Project Mockup](public/assets/mockup.png)

> **The future of fresh produce shopping.** Vegetable Market AI transforms the mundane task of grocery shopping into a premium, interactive experience. Combining a bioluminescent 3D vegetable "party" with a state-of-the-art glassmorphism interface and high-resolution photographic assets.

---

## 🌟 Premium Features

### 📸 High-Fidelity Visual Assets
- **Professional Photography**: Replaced legacy symbolic icons with a curated catalog of realistic, high-resolution product images.
- **Visual Consistency**: Every product card, modal, and checkout item features professional-grade lighting and presentation.

### 🎮 Immersive 3D Interactive Scene
- **Bioluminescent Environment**: A stunning full-screen 3D scene built with **Three.js** where vegetables float in a cosmic, neon-lit space.
- **Dynamic Interaction**: 3D models respond to user cursor movements with smooth animations, glows, and scaling effects.
- **Seamless Integration**: Clicking a 3D vegetable object triggers a premium UI overlay with real-time product data.

### 💎 Advanced Glassmorphism Design
- **Frosted Aesthetics**: High-fidelity UI using semi-transparent elements with `backdrop-filter` for a modern "Apple-style" glass effect.
- **Neon-Glow Palette**: A sophisticated dark-mode palette featuring vibrant emerald greens and deep purples.
- **Micro-Interactions**: Fluid transitions, buttery-smooth hover states, and dynamic typography powered by modern CSS.

### 🔐 Enterprise-Grade Backend & Logic
- **Role-Based Access Control (RBAC)**: Distinct, secure interfaces for **Admins** (Inventory/User management) and **Employees** (Order fulfillment).
- **Transactional Inventory**: Real-time stock management with MySQL to ensure accurate availability and prevent oversales.
- **Secure Architecture**: JWT-based authentication, password hashing with BCrypt, and robust middleware protection.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | HTML5, Modern CSS (Glassmorphism), Vanilla JS (ES6+) |
| **3D Engine** | **Three.js**, Custom 3D Geometry & Shaders |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL (Connection Pooling & Promises) |
| **Auth** | JWT, BCrypt, Role-Based Middleware |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **MySQL** (Running instance)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Rushigit1520/vegetable-market-ai.git

# Navigate to project
cd vegetable-market-ai

# Install dependencies
npm install
```

### 3. Database Configuration
Create a `.env` file in the root directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=veg_market_db
JWT_SECRET=super_secret_key
PORT=3000
```

### 4. Initialization
Seed the database with the premium product catalog:
```bash
npm run seed
```

### 5. Launch
```bash
npm start
```
Visit **[http://localhost:3000](http://localhost:3000)** to enter the experience!

---

## 📂 Project Architecture

```text
├── config/             # Database connection & seed logic
├── data/               # Product catalog & static assets registry
├── middleware/         # Security & RBAC layers
├── public/             # Static Assets & Frontend
│   ├── assets/         # High-resolution product photography
│   ├── css/            # Premium Design System (CSS Variables/Glass)
│   ├── js/             # Three.js scene & Interactive state logic
│   └── *.html          # Semantic HTML5 Layouts
├── routes/             # RESTful API Endpoints
├── server.js           # Server Entry Point
└── README.md           # Documentation
```

---

## 🔐 Default Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@freshcart.com` | `admin123` |
| **Employee** | `employee@freshcart.com` | `emp123` |

---

## 👤 Credits

Developed with ❤️ by **Rushigit1520** using the power of **Antigravity AI**.
