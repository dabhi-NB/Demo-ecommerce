# Demo E-commerce Platform

A full-stack e-commerce demo application with separate admin and user panels. Built with modern TypeScript, Node.js backends, Next.js frontend for users, and React/Vite for admin.

## 🚀 Features
- **User Side**: Next.js storefront with cart, wishlist, orders, auth, product catalog.
- **Admin Side**: React dashboard for managing products, categories, orders, users, coupons, SEO.
- **Backends**: REST APIs with auth, Redis caching, email/SMS, file uploads, payments-ready.
- Tech: TypeScript, Tailwind CSS, Prisma-like models, Nodemailer, Rate limiting.

## 🗂️ Project Structure
```
Demo-ecommerce/
├── admin_backend/     # Admin Node.js API (Vite/TS)
├── admin_frontend/    # Admin React dashboard
├── user_backend/      # User-facing Node.js API
├── user_frontend/     # User Next.js storefront
├── .gitignore         # Ignores node_modules, uploads, builds
└── README.md
```

## 🛠️ Prerequisites
- Node.js 18+
- npm/yarn/pnpm
- Database (MySQL/PostgreSQL via models)
- Redis (optional for cache/session)

## 📦 Setup & Run

### 1. Clone & Install
```bash
git clone <your-repo>
cd Demo-ecommerce
```

### 2. Backend Setup (Admin & User)
```bash
# Admin Backend
cd admin_backend
npm install
cp .env.example .env  # Configure DB, JWT, email, etc.
npm run dev

# User Backend (new terminal)
cd ../user_backend
npm install
cp .env.example .env
npm run dev
```

### 3. Frontend Setup
```bash
# Admin Frontend
cd ../admin_frontend
npm install
npm run dev

# User Frontend
cd ../user_frontend
npm install
npm run dev
```

### 4. Access
- **User Store**: http://localhost:3000
- **Admin Dashboard**: http://localhost:5173 (admin_backend port)
- **APIs**: Check .env for ports (default 4001/4002)

## 🔧 Configuration
- Copy `.env.example` to `.env` in each subdir.
- Update DB creds, JWT secrets, email SMTP, API keys.
- Uploads: Stored in `admin_backend/upload/` (ignored by git).

## 📚 Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | Lint code |
| `npm run preview` | Preview build |

## 🤝 Contributing
1. Fork & clone.
2. Install deps.
3. Create branch: `git checkout -b feature/xyz`.
4. Commit: `git commit -m "feat: add xyz"`.
5. Push & PR.

## 📄 License
MIT
