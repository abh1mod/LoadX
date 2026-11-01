# 🚚 LoadX — B2B Freight Marketplace & Real-Time Bidding Platform

<p align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/truck.svg" width="64" height="64" alt="LoadX Logo" />
</p>

<p align="center">
  <strong>A premium, real-time B2B freight bidding and logistics marketplace connecting enterprise shippers with verified transport agencies.</strong>
</p>

<p align="center">
  <a href="#-three-theme-design-system"><img src="https://img.shields.io/badge/UI_Theme-Three--Theme_Architecture-3156D9?style=for-the-badge" alt="Design System" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/Frontend-React_18_%7C_Vite_%7C_Tailwind-2563EB?style=for-the-badge" alt="Frontend" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/Backend-Node.js_%7C_Express_%7C_MongoDB-047857?style=for-the-badge" alt="Backend" /></a>
  <a href="#-deployment"><img src="https://img.shields.io/badge/Deploy-Railway_%7C_Netlify-000000?style=for-the-badge" alt="Deploy" /></a>
</p>

---

## 📖 Overview

**LoadX** is an enterprise-grade freight procurement and dispatch management platform designed to replace manual freight negotiations with automated, real-time reverse auction bidding. 

Shippers post consignments with precise cargo specifications, pickup/delivery dates, and vehicle requirements. Verified logistics and transport agencies submit competitive bids in live bidding rooms. Shippers can evaluate transparent carrier leaderboards, end auctions early or let countdown windows elapse, award contracts to optimal carriers, track milestone dispatch progression, and submit carrier reviews upon delivery.

---

## 🎨 Three-Theme Design System

LoadX features a centralized, context-aware design token architecture that switches theme identities based on the active role and page context:

| Theme | Target Pages | Palette Identity | Primary Accent | Background / Sidebar |
|---|---|---|---|---|
| **BASE** | Landing, Auth, Admin Portal, Common Controls | Navy + Slate Blue | `#3156D9` (Slate Blue) | Deep Midnight Navy (`#101D35`) / Light Cool Gray (`#F4F6FA`) |
| **SUPPLIER** | Shipper Dashboard, Consignment Creation, Bid Awarding | Royal Blue / Ocean Navy | `#2563EB` (Royal Blue) | Ocean Navy (`#102A43`) / Ice Blue Gray (`#F3F6FC`) |
| **TRANSPORTER** | Carrier Dashboard, Available Loads, Reverse Bidding, Earnings | Forest Green / Emerald | `#047857` (Emerald) | Forest Green (`#073B2E`) / Mint Tint (`#F2F7F4`) |

Shared components (`Button`, `Table`, `Badge`, `Card`, `Modal`, `StatCard`, `Navbar`, `Sidebar`) dynamically inherit their visual accents, borders, and hover elevations from the active theme without breaking brand cohesion.

---

## ✨ Key Features

### 🏢 1. Shipper / Supplier Portal
- **Consignment Creation**: Post detailed freight requests with origin/destination addresses, pincodes, cargo categories, gross weights, volumes, required vehicle types, and bidding windows.
- **Live Reverse Auction Room**: Monitor real-time bid drops, lowest quote highlights, and competitive carrier rankings updated every second.
- **Early Auction Termination**: End bidding on demand with a single click instead of waiting for countdown timers to reach zero.
- **Smart Bid Comparison**: Comprehensive comparison table evaluating carrier bid amounts, ratings, verification badges, vehicle specs, and delivery estimates.
- **Contract Awarding**: Instant one-click carrier contract award with automatic status synchronization.
- **Consignment Tracking**: Monitor multi-step dispatch milestones (`Awarded` &rarr; `Dispatched` &rarr; `In Transit` &rarr; `Delivered`).
- **Carrier Ratings & Reviews**: Submit structured reviews and star ratings once freight is delivered.

### 🚛 2. Transport Agency / Carrier Portal
- **Consignment Discovery Board**: Discover open shipments with live countdown timers, route tags, cargo specs, and target budgets.
- **Competitive Bidding**: Place and update bids in real time with transparent feedback on current position and lowest bid.
- **Awarded Shipments Management**: Manage active consignments, download job details, and view shipper contacts.
- **Milestone Dispatch Progression**: Update dispatch progress in one click with timestamped audit trails.
- **Earnings & Financial Analytics**: Visual KPI cards tracking completed trips, pending receivables, and net revenue.

### 🛡️ 3. Platform Administration & Compliance
- **Enterprise Control Center**: Monitor total platform users, active consignments, live auctions, and system throughput.
- **KYC & Fleet Verification**: Review uploaded GSTIN certificates, PAN cards, and fleet documents to approve or reject transporter registrations.
- **Account Governance**: Instant suspension, unblocking, or deletion of fraudulent accounts with immediate JWT invalidation.
- **Database Reseed Tool**: Built-in reset utility to seed realistic demo data across all roles on demand.

---

## 🛠️ Tech Stack

### Frontend (`freightbid-client`)
- **Core**: React 18 (Functional components, Hooks, Context API)
- **Tooling & Bundler**: Vite 6, PostCSS, Autoprefixer
- **Styling**: Tailwind CSS 3.4 with custom theme tokens & CSS variables
- **Routing**: React Router DOM 6
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Dates & Timezones**: Date-fns with IST (Asia/Kolkata) timezone adapters

### Backend (`freightbid-server`)
- **Runtime & Framework**: Node.js, Express.js (REST API architecture)
- **Database**: MongoDB with Mongoose ODM
- **Persistent Embedded Engine**: Automatic fallback to persistent in-memory MongoDB (`wiredTiger`) if no external MongoDB instance is reachable.
- **Authentication**: JWT (JSON Web Tokens), bcryptjs password hashing, database-reverified status checks on every request.
- **Security**: Helmet security headers, CORS origin whitelisting, Express Rate Limit.
- **Background Cron Engine**: Node-cron worker running every 5 seconds for autonomous time-based status transitions (`UPCOMING` &rarr; `OPEN` &rarr; `CLOSED` / `EXPIRED`).
- **File Uploads**: Multer memory storage + Cloudinary document handling.

---

## 📁 Repository Structure

```
LoadX/
├── freightbid-client/            # React 18 + Vite Frontend Application
│   ├── src/
│   │   ├── api/                  # Axios instance and API service calls
│   │   ├── components/
│   │   │   ├── common/           # Button, Card, Table, Badge, Modal, Stepper, etc.
│   │   │   └── layout/           # Navbar, Sidebar, DashboardLayout
│   │   ├── context/              # AuthContext, ThemeContext
│   │   ├── hooks/                # usePolling, useAuth
│   │   ├── pages/
│   │   │   ├── admin/            # AdminDashboard, AdminUsers, AdminShipments
│   │   │   ├── public/           # HomePage, LoginPage, RegisterPage
│   │   │   ├── supplier/         # SupplierDashboard, ShipmentForm, Detail, Shipments
│   │   │   └── transporter/      # TransporterBrowse, Detail, Awarded, MyBids
│   │   ├── utils/                # formatters, constants, dateUtils
│   │   ├── App.jsx               # Route declarations & role gates
│   │   ├── index.css             # Tailwind base & CSS theme tokens
│   │   └── main.jsx
│   ├── netlify.toml              # Netlify client deployment configuration
│   ├── tailwind.config.js        # Three-theme design system tokens
│   └── vite.config.js
│
├── freightbid-server/            # Express.js REST API Backend
│   ├── src/
│   │   ├── config/               # Database connection (db.js) & Cloudinary
│   │   ├── controllers/          # admin, auth, public, shipment, transporter
│   │   ├── jobs/                 # statusCron.js (autonomous 5s transitions)
│   │   ├── middleware/           # auth, errorHandler, upload, validate
│   │   ├── models/               # User, Shipment, Bid, Review schemas
│   │   ├── routes/               # Modular Express API routes
│   │   ├── seed/                 # Realistic multi-role seed dataset
│   │   ├── services/             # shipmentService (leaderboards & status)
│   │   ├── utils/                # constants, dateUtils, token
│   │   ├── app.js                # Express app setup & route mounting
│   │   └── server.js             # HTTP listener & process lifecycle
│   ├── Procfile                  # Railway / Heroku web process definition
│   ├── railway.json              # Railway deployment specifications
│   └── package.json
│
├── netlify.toml                  # Monorepo root Netlify configuration
└── README.md
```

---

## ⚡ Quick Start & Local Development

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Package Manager**: npm (v9+)
- **MongoDB**: Local MongoDB instance or MongoDB Atlas URI *(Optional: If no MongoDB is running, LoadX automatically boots an embedded persistent MongoDB server).*

---

### 1. Clone the Repository
```bash
git clone https://github.com/abh1mod/LoadX.git
cd LoadX
```

---

### 2. Configure & Run Backend Server

```bash
cd freightbid-server

# Install backend dependencies
npm install

# Setup environment variables
cp .env.example .env
```

Verify your `.env` settings:
```ini
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/freightbid
JWT_SECRET=supersecretfreightbidjwtkey_production_grade_security_token_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
TZ=Asia/Kolkata
```

Seed the database with realistic test accounts, active consignments, and live bids:
```bash
npm run seed
```

Start the backend development server:
```bash
npm run dev
```
> Server runs at `http://localhost:5000`  
> Health check: `http://localhost:5000/api/health`

---

### 3. Configure & Run Frontend Client

In a separate terminal:
```bash
cd freightbid-client

# Install frontend dependencies
npm install

# Start Vite dev server
npm run dev
```
> Client runs at `http://localhost:5173`

---

## 🔑 Demo Seed Accounts

The database seeder provisions realistic accounts across all three platform roles:

| Role | Email | Password | Access / Permissions |
|---|---|---|---|
| **Admin** | `admin@loadx.com` | `Admin@123` | Platform KPIs, Transporter verification, User blocking, Reseed |
| **Supplier** | `rajesh@apexsupply.com` | `Supplier@123` | Post shipments, live bidding room, early auction close, award contracts |
| **Transporter 1** | `vikram@speedyfreight.com` | `Transporter@123` | Verified fleet (18 trucks), browse loads, place bids, advance milestones |
| **Transporter 2** | `contact@delhitrans.com` | `Transporter@123` | Verified fleet (45 trucks), competitive bidding, earnings overview |
| **Pending Transporter** | `pending@newfleet.com` | `Transporter@123` | Awaiting admin verification (simulates approval workflow) |

---

## 📡 REST API Reference

All protected endpoints require an `Authorization: Bearer <JWT>` header.

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new Supplier or Transporter | Public |
| `POST` | `/api/auth/login` | Login and receive JWT token | Public |
| `GET` | `/api/auth/me` | Get current authenticated user profile | Authenticated |
| `POST` | `/api/auth/logout` | Invalidate session client-side | Authenticated |

### Shipments & Bidding (`/api/shipments`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/shipments` | Browse shipments with status & query filters | Authenticated |
| `POST` | `/api/shipments` | Create a new consignment | Supplier |
| `GET` | `/api/shipments/mine` | List shipments created by current supplier | Supplier |
| `GET` | `/api/shipments/:id` | Get detailed consignment specifications | Authenticated |
| `POST` | `/api/shipments/:id/end-bidding` | **End bidding early** and close auction | Supplier |
| `GET` | `/api/shipments/:id/leaderboard` | Live real-time leaderboard (polled every 1s) | Authenticated |
| `POST` | `/api/shipments/:id/bids` | Submit a competitive bid on an open load | Transporter |
| `POST` | `/api/shipments/:id/award` | Award contract to selected carrier bid | Supplier |
| `PATCH`| `/api/shipments/:id/milestone` | Advance delivery milestone status | Transporter |
| `POST` | `/api/shipments/:id/review` | Submit rating & review for completed delivery | Supplier |

### Administration (`/api/admin`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Platform metrics, user counts, load volume | Admin |
| `GET` | `/api/admin/users` | List and filter all platform accounts | Admin |
| `PATCH`| `/api/admin/users/:id/verify` | Verify transporter KYC and fleet documents | Admin |
| `PATCH`| `/api/admin/users/:id/block` | Block account with immediate token revocation | Admin |
| `POST` | `/api/admin/reseed` | Trigger fresh platform database reseed | Admin |

---

## 🚀 Production Deployment

### 1. Deploy Frontend on Netlify
The repository contains both root and client [`netlify.toml`](file:///c:/Users/abhis/Desktop/LoadX/netlify.toml) configurations with single-page app (SPA) rewrite rules and HTTP security headers:
- **Base directory**: `freightbid-client`
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Environment variables**:
  - `VITE_API_URL`: `https://<your-railway-backend>.up.railway.app/api`

### 2. Deploy Backend on Railway
The server is configured for seamless deployment via Nixpacks and Railway:
- In your Railway service settings:
  - **Root Directory**: `/freightbid-server`
  - **Start Command**: `npm start`
  - **Healthcheck Path**: `/api/health`
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `PORT`: `5000` (or Railway default `$PORT`)
  - `MONGO_URI`: `mongodb+srv://<user>:<password>@cluster.mongodb.net/loadx`
  - `JWT_SECRET`: `<secure-random-secret>`
  - `CLIENT_URL`: `https://<your-client>.netlify.app`
  - `TZ`: `Asia/Kolkata`

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
