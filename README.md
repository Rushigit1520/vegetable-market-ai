# 🥬 Vegetable Market AI — 3D Interactive Experience

A highly creative, interactive, and visually stunning web application for an online vegetable market. This version transforms the traditional shopping experience into a **"Vegetable Party"** using immersive 3D animations and a premium dark glassmorphism interface.

## ✨ New & Advanced Features

- **3D "Vegetable Party" Background**: A full-screen, interactive 3D scene built with **Three.js** featuring procedural vegetables dancing and floating in a bioluminescent environment.
- **20+ Procedural 3D Models**: Includes interactive models for Potato, Onion, Tomato, Brinjal, Cauliflower, Cabbage, Spinach, Green Chili, Carrot, Peas, Capsicum, Gourds, Pumpkin, Drumstick, and Radish.
- **Interactive Objects**: Vegetables react to cursor movement with scale and glow animations. Clicking a 3D vegetable opens its specific product details.
- **Modern Dark Glassmorphism UI**: A high-fidelity dark theme utilizing semi-transparent "frosted glass" elements (`backdrop-filter`) for a sleek, premium feel.
- **Dynamic Product Modal**: Implemented a modal system that bridges the 3D scene and the product database, allowing users to view varieties and add to cart directly from the animation.
- **Role-Based Inventory Management**: Integrated system for Admins and Employees to manage stock and orders in real-time.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Vanilla + Glassmorphism), JavaScript (ES6+)
- **Animation/3D**: **Three.js** (3D Rendering), Custom Procedural Modeling
- **Backend**: Node.js, Express.js
- **Database**: MySQL (Transactional stock management)
- **Security**: JWT Authentication & BCrypt Password Hashing

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/)
- [MySQL](https://www.mysql.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Rushigit1520/vegetable-market-ai.git
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment**: Create a `.env` file based on `.env.example` with your MySQL credentials.
4. **Seed Database**: Initialize the database and load the 3D-compatible product list:
   ```bash
   npm run seed
   ```

### Running the App

Start the server:
```bash
npm start
```
Visit `http://localhost:3000` to experience the 3D vegetable party!

## 🔐 Admin Dashboard

Access the management suite at `/login.html`:
- **Email:** `admin@freshcart.com`
- **Password:** `admin123`

## 👤 Credits

Built by **Rushigit1520** with the power of Advanced AI Agents.
