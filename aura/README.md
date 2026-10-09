# AURA Store — E-Commerce Site

A modern, full-stack E-Commerce platform built with **Node.js**, **Express.js**, **MongoDB (Mongoose)**, and **Vanilla HTML5/CSS3/JavaScript**.

Designed with clean layered software architecture, rock-solid security defaults (bcrypt password hashing, JWT authorization, server-side price & inventory verification), and a responsive, dark-mode glassmorphic storefront.

---

## 🌟 Key Features

1. **Product Catalog & Details**:
   - Dynamic product listings with real-time search, category filtering, and sorting (Price, Rating, Newest).
   - Interactive Product Details modal displaying high-resolution vector artwork, specifications, verified review ratings, remaining inventory status, and dynamic quantity selectors.
   - Text indexing and pagination support.

2. **Shopping Cart**:
   - Real-time slide-over cart drawer with animated item counters.
   - Quantity adjustment (`+` / `-`), individual item removal, and auto-calculated tax, subtotal, and free shipping thresholds.
   - Persistent guest state in `localStorage` with automatic server synchronization upon user login.

3. **Order Processing & Checkout**:
   - Secure multi-step checkout validating recipient shipping details and simulated payment methods (Credit Card, PayPal, Cash on Delivery).
   - **Server-Side Security**: Verified prices and stock against database records to prevent client-side price tampering.
   - Automatic inventory deduction upon order placement.
   - Order confirmation summary and permanent order history tracking with live fulfillment status badges (`Processing`, `Shipped`, `Delivered`).

4. **User Authentication & Management**:
   - Registration and Login with bcrypt password hashing (10 salt rounds) and stateless JSON Web Tokens (JWT).
   - One-click demo credential autofill for immediate testing (`customer@aurashop.com`, `admin@aurashop.com`).
   - Role-based access control protecting admin endpoints (product creation, order status updates).

5. **Zero-Configuration In-Memory & Atlas MongoDB Support**:
   - Supports any standard `MONGODB_URI` connection (local `mongod` or MongoDB Atlas).
   - Includes graceful embedded in-memory database fallback (`mongodb-memory-server`) for instant out-of-the-box development and automated CI testing without manual database installation.

---

## 📁 Project Architecture

```
e-commerce-site/
├── public/                     # Frontend client assets
│   ├── css/
│   │   └── style.css           # Vanilla CSS design system & micro-animations
│   ├── images/                 # Custom vector product illustrations (SVG)
│   ├── js/
│   │   └── app.js              # Client state, REST API client, DOM controller
│   └── index.html              # Semantic, accessible HTML5 layout
├── src/
│   ├── config/
│   │   ├── config.js           # Environment variable configuration
│   │   └── db.js               # MongoDB connection with in-memory fallback
│   ├── controllers/
│   │   ├── authController.js   # User registration, login, profile
│   │   ├── cartController.js   # Cart management & sync
│   │   ├── orderController.js  # Order processing & inventory decrement
│   │   └── productController.js# Product queries, search, CRUD
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT protect & admin role guards
│   │   └── errorHandler.js     # Centralized error handler
│   ├── models/
│   │   ├── Cart.js             # Mongoose cart schema
│   │   ├── Order.js            # Mongoose order schema
│   │   ├── Product.js          # Mongoose product schema with text index
│   │   └── User.js             # Mongoose user schema with bcrypt hooks
│   ├── routes/
│   │   ├── authRoutes.js       # /api/auth routes
│   │   ├── cartRoutes.js       # /api/cart routes
│   │   ├── orderRoutes.js      # /api/orders routes
│   │   └── productRoutes.js    # /api/products routes
│   ├── utils/
│   │   ├── generateToken.js    # JWT generation helper
│   │   └── seed.js             # Database seeding script
│   ├── app.js                  # Express application setup
│   └── server.js               # HTTP server entrypoint & graceful shutdown
├── tests/
│   └── api.test.js             # Automated API test suite
├── package.json
└── progress.md                 # Persistent work log
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18+ (tested on Node v24)
- npm v9+

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm start
```
The server will automatically connect to MongoDB (or launch the in-memory engine) and auto-seed initial products and demo accounts if the database is fresh.

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🔑 Demo Accounts

Use the quick-fill buttons in the sign-in modal, or enter manually:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Customer** | `customer@aurashop.com` | `password123` |
| **Admin** | `admin@aurashop.com` | `password123` |

---

## 🧪 Running the Test Suite

Execute the automated test suite with Node's native test runner and Supertest:
```bash
npm test
```

Tests cover:
- User registration, duplicate prevention, and authentication.
- JWT verification and unauthorized route protection.
- Product catalog querying, category filtering, search, and details retrieval.
- Cart synchronization, item additions, and quantity adjustments.
- Order creation, stock decrement verification, and order history fetching.

---

## ⚙️ Environment Variables (Optional)

You can customize runtime behavior by adding a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/aurashop
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
```
*Note: If `MONGODB_URI` is omitted or unavailable, the application automatically launches an embedded in-memory MongoDB instance.*

---

## 📡 API Reference Summary

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/profile` — Fetch authenticated profile (*Private*)

### Products (`/api/products`)
- `GET /api/products` — List products (supports `keyword`, `category`, `sort`, `page`)
- `GET /api/products/categories/list` — List distinct categories
- `GET /api/products/:id` — Fetch product details by ID
- `POST /api/products` — Create product (*Admin*)
- `PUT /api/products/:id` — Update product (*Admin*)
- `DELETE /api/products/:id` — Remove product (*Admin*)

### Shopping Cart (`/api/cart`)
- `GET /api/cart` — Get user's cart (*Private*)
- `POST /api/cart` — Add item to cart (*Private*)
- `PUT /api/cart/:productId` — Update item quantity (*Private*)
- `DELETE /api/cart` — Clear cart (*Private*)
- `POST /api/cart/sync` — Sync guest cart to user account (*Private*)

### Orders (`/api/orders`)
- `POST /api/orders` — Create order & process checkout (*Private*)
- `GET /api/orders/myorders` — List user's order history (*Private*)
- `GET /api/orders/:id` — Get single order details (*Private*)
- `GET /api/orders` — List all orders across users (*Admin*)
- `PUT /api/orders/:id/status` — Update order fulfillment status (*Admin*)
