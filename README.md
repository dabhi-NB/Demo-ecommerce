# 🛒 Demo E-Commerce Platform

A full-stack e-commerce demo with **admin dashboard**, **user storefront**, and complete backend APIs. Built with TypeScript, Node.js, Next.js (user), React/Vite (admin), and MongoDB.

---

## 🏗️ Project Structure

```
Demo-ecommerce/
├── admin_backend/     # Admin REST API (Node.js + Express + MongoDB)
├── admin_frontend/    # Admin Dashboard (React + Vite + shadcn/ui)
├── user_backend/      # User-facing REST API (Node.js + Express + MongoDB)
├── user_frontend/     # User Storefront (Next.js + Tailwind)
├── dummy_data.json    # Complete test dataset for MongoDB seeding
└── README.md
```

---

## ✅ Features Implemented

### Admin Backend
- Auth (login/OTP/forgot password/TFA)
- Admin & User CRUD management
- Products with variant support (color/size/custom)
- Categories with **sub-category tree** (parent/level/path)
- Orders with full lifecycle management
- Coupons (percentage + flat discount)
- **Nav Items management** (header/footer/sidebar, visibility rules)
- **Feature toggles** (master switches for all features)
- **Theme & Store settings** (colors, fonts, currency, store type)
- **PDF invoice generation**
- **Bulk CSV/Excel product import**
- **Inventory/low-stock alerts**
- SEO meta management
- Email template management
- Device/session management
- Payment gateway management (Razorpay, Stripe, etc.)
- SMS notifications
- Redis/memory cache system

### User Backend
- User auth (register/login/OTP/TFA)
- Product listing, search, filters, featured products
- **Variant-aware cart** (different variants = different line items)
- Wishlist
- Order placement with coupon support
- Order tracking & cancellation
- **Razorpay payment integration** (initiate/verify/webhook)
- User profile & address management
- Public settings & nav fetch

### User Frontend (Next.js)
- Home page with dynamic nav
- Product catalog with filters and search
- Product detail with variant selector
- Cart with variant line items
- Checkout with coupon application
- Order tracking
- Wishlist
- User auth (register/login/OTP/TFA)
- Account management (profile, addresses, sessions)

### Admin Frontend (React + Vite)
- Dashboard with analytics charts
- Product CRUD with image management
- Category CRUD with sub-category support
- Order management with status updates
- User management with address/cart/wishlist view
- Coupon management
- **Navigation management** (CRUD, ordering, location, visibility)
- **Feature toggle control panel**
- **Inventory monitoring with low-stock alerts**
- Settings (General, Logo, Mail, reCAPTCHA, Social, Content, Payment, **Theme & Store**)
- SEO meta management
- Email template management
- Admin account management with TFA

---

## 🚀 Setup & Run

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (optional — falls back to memory cache)

### 1. Clone & Install

```bash
git clone <repo-url>
cd Demo-ecommerce

# Install all dependencies
cd admin_backend && npm install && cd ..
cd user_backend && npm install && cd ..
cd admin_frontend && npm install && cd ..
cd user_frontend && npm install && cd ..
```

### 2. Environment Variables

```bash
# Admin Backend
cp admin_backend/.env.example admin_backend/.env

# User Backend
cp user_backend/.env.example user_backend/.env
```

Key env vars:
```env
# Both backends
MONGODB_URI=mongodb://localhost:27017/demo_ecommerce
JWT_SECRET=your_jwt_secret_here
API_KEY=your_api_key_here

# Admin Backend (.env)
PORT=5001
ADMIN_JWT_SECRET=your_admin_secret

# User Backend (.env)
PORT=5000

# Email (both)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your@email.com
MAIL_PASS=your_app_password

# Payment (user_backend)
# Set via admin panel Settings > Payment
```

### 3. Start Development Servers

```bash
# Terminal 1: Admin Backend
cd admin_backend && npm run dev

# Terminal 2: User Backend
cd user_backend && npm run dev

# Terminal 3: Admin Frontend
cd admin_frontend && npm run dev

# Terminal 4: User Frontend
cd user_frontend && npm run dev
```

### 4. Access

| App | URL |
|-----|-----|
| User Store | http://localhost:3000 |
| Admin Dashboard | http://localhost:3001 |
| Admin API | http://localhost:5001 |
| User API | http://localhost:5000 |

---

## 🗄️ Test Data

See `dummy_data.json` for complete test dataset including:
- 5 categories with sub-categories
- 5 products (with/without variants)
- 3 coupons
- 5 sample users
- Nav items (header + footer)
- Settings (theme, features, store config)

**Import instructions in `dummy_data.json` → `import_instructions`**

---

## 🔑 API Reference

### Admin APIs (port 5001)
```
POST /auth/login
GET  /admin/dashboard
GET  /admin/products
GET  /admin/orders
GET  /admin/nav              — List nav items
POST /admin/nav/create       — Create nav item
PUT  /admin/nav/:id          — Update nav item
GET  /admin/features         — Get feature toggles
POST /admin/features/save    — Save feature toggles
POST /admin/setting/save-theme  — Save theme settings
POST /admin/setting/save-store  — Save store settings
GET  /admin/orders/:id/invoice  — Download PDF invoice
GET  /admin/inventory/alerts    — Low stock alerts
POST /admin/bulk/import-products — CSV import
```

### User APIs (port 5000)
```
POST /register
POST /auth/login
GET  /products
GET  /products/:slug
GET  /categories
GET  /cart
POST /cart/items             — Add to cart (with variantId)
POST /orders                 — Place order
POST /payment/initiate       — Start Razorpay payment
POST /payment/verify         — Verify payment
POST /payment/webhook        — Razorpay webhook
POST /coupons/validate
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB + Mongoose |
| Cache | Redis / In-memory fallback |
| Admin UI | React + Vite + shadcn/ui + Tailwind |
| User UI | Next.js 14 + Tailwind CSS |
| Auth | JWT + OTP + TOTP (TFA) |
| Payments | Razorpay (+ Stripe/Cashfree ready) |
| Email | Nodemailer (SMTP) |
| SMS | Fast2SMS |
| PDF | pdfkit / puppeteer-html-pdf |
| File Upload | Multer + Sharp |
| Rate Limiting | express-rate-limit |

---

## 📄 License

MIT
