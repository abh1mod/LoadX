# FreightBid Client

FreightBid is a modern, high-performance, real-time reverse freight auction single-page application built with React, Vite, Tailwind CSS, Lucide icons, and React Router.

---

## 🛠️ Tech Stack & Design System

- **Framework**: React 18 with Vite
- **Language**: Plain JavaScript (NO TypeScript)
- **Styling**: Tailwind CSS with customized SaaS palette (#F8FAFC soft gray backgrounds, #1E3A8A deep navy, #4338CA indigo, #0D9488 teal, Inter typography)
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Dates & Currency**: date-fns & Indian Rupee (INR ₹) formatting
- **Real-Time Bidding**: 1-second short polling with automatic overlap avoidance and pulse sync
- **State Management**: React Context API (`AuthContext`) + LocalStorage

---

## 📁 Directory Structure

```
freightbid-client/
├── src/
│   ├── api/
│   │   └── axios.js            # Axios client with JWT interceptor & 401/403 handlers
│   ├── components/
│   │   ├── common/
│   │   │   ├── Badge.jsx       # Status badges with semantic dot colors
│   │   │   ├── Button.jsx      # Buttons with loading spinners & variants
│   │   │   ├── Card.jsx        # Rounded-xl SaaS cards with headers
│   │   │   ├── Countdown.jsx   # Server-synced countdown timer
│   │   │   ├── EmptyState.jsx  # Friendly illustrated empty states
│   │   │   ├── Input.jsx       # Form inputs with icons & validation
│   │   │   ├── Modal.jsx       # Accessible modals with backdrops
│   │   │   ├── RatingStars.jsx # Interactive 1-5 star ratings
│   │   │   ├── StatCard.jsx    # Metric KPI cards
│   │   │   ├── Stepper.jsx     # Sequential transit milestone tracker
│   │   │   └── Table.jsx       # Responsive tabular view
│   │   └── layout/
│   │       ├── DashboardLayout.jsx # Role-guarded dashboard shell
│   │       ├── Navbar.jsx      # Main application top navigation
│   │       └── Sidebar.jsx     # Role-specific sidebar navigation
│   ├── context/
│   │   └── AuthContext.jsx     # Authentication state & session manager
│   ├── hooks/
│   │   └── usePolling.js       # Overlap-safe 1000ms polling hook
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminShipments.jsx
│   │   │   └── AdminUsers.jsx
│   │   ├── public/
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── supplier/
│   │   │   ├── ShipmentFormPage.jsx
│   │   │   ├── SupplierDashboard.jsx
│   │   │   ├── SupplierShipmentDetail.jsx
│   │   │   └── SupplierShipments.jsx
│   │   └── transporter/
│   │       ├── TransporterAwarded.jsx
│   │       ├── TransporterBrowse.jsx
│   │       ├── TransporterMyBids.jsx
│   │       └── TransporterShipmentDetail.jsx
│   ├── utils/
│   │   └── formatters.js       # INR ₹, date-fns, and milestone constants
│   ├── App.jsx                 # Route declarations & role guards
│   ├── index.css               # Tailwind & pulse animations
│   └── main.jsx                # React DOM root entry
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## 🚀 Setup & Scripts

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `VITE_API_URL` points to your running FreightBid backend:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Available NPM Scripts
- `npm run dev`: Starts the Vite development server on `http://localhost:5173`
- `npm run build`: Bundles the React application for production into `dist/`
- `npm run preview`: Locally previews the production build

---

## 🎯 Demo Walkthrough by Role

### 1. Platform Admin Demo
- **Login**: `admin@freightbid.com` / `Admin@123`
- **Dashboard (`/admin`)**: Inspect platform totals, active auctions, delivered freight, and trigger a complete database reset if desired.
- **User Verification (`/admin/users`)**: Filter by `Pending` to view submitted carrier applications. Open user details to inspect GST certificates and transport permits. Click **Verify** to immediately approve an application or **Reject** with a custom reason. Test blocking and unblocking accounts.
- **Shipments Registry (`/admin/shipments`)**: Read-only oversight of all consignments, bid tallies, and awarded amounts.

### 2. Shipper / Supplier Demo
- **Login**: `supplier1@apexlogistics.com` / `Supplier@123`
- **Dashboard (`/supplier`)**: View quick metrics and live consignment cards with countdown timers.
- **Create Consignment (`/supplier/shipments/new`)**: Specify origin and destination details, cargo weight, vehicle category, optional budget cap, and exact auction start and end datetimes.
- **Live Reverse Auction Room (`/supplier/shipments/:id`)**:
  - Watch the live bidding table updating every 1 second via polling.
  - See Rank 1 highlighted in emerald green.
  - Watch the countdown timer ticking towards hard close.
- **Awarding Freight**: Once the auction closes, click **Award Contract** next to any bidder.
- **Review Carrier**: For delivered shipments, submit a 1–5 star rating and comment, which instantly publishes to the public Home Page testimonials.
- **Reposting**: Expired shipments with 0 bids can be reposted with 1 click via the pre-filled repost form.

### 3. Carrier / Transporter Demo
- **Login**: `transporter1@delhifleet.com` / `Transporter@123`
- **Browse Freight Loads (`/transporter`)**: Filter by vehicle category, city, or status. See active budget caps and countdown timers.
- **Reverse Bidding Room (`/transporter/shipments/:id`)**:
  - Prominent KPI card displaying **"Your Rank: #1 of 4"** with your current rate.
  - Enter a new rate in the bid box (e.g. lower by ₹2,000) and click **Update Active Bid Rate**.
  - Receive instant toast feedback and see your position animate to Rank #1 on both your screen and the supplier's screen in real time.
- **My Bids (`/transporter/my-bids`)**: Track active bids and win/loss outcomes.
- **Awarded Contracts (`/transporter/awarded`)**:
  - View won consignments.
  - Click **Mark as: <Next Milestone>** to sequentially progress through the 6 stages (`Awarded` &rarr; `Pickup Scheduled` &rarr; `Picked Up` &rarr; `In Transit` &rarr; `Out for Delivery` &rarr; `Delivered`).
  - Attach optional transit notes for shipper tracking.

### 4. Registration Flow
- Navigate to `/register`.
- Choose either **Transporter** or **Supplier**.
- Fill in company details, fleet profile, and attach test verification documents (PDF or image).
- Submit to see the **Pending Verification** screen. Notice that trying to log in while pending cleanly shows the administrator review notice.
