# FreightBid Server API

FreightBid is a high-performance, production-quality freight bidding platform built with the MERN stack (Node.js, Express, MongoDB, Mongoose) in plain JavaScript.

---

## 🛠️ Tech Stack & Architecture

- **Runtime & Framework**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM (includes embedded persistent MongoDB engine fallback if local MongoDB service is not detected)
- **Authentication**: JWT (Bearer token in Authorization header), bcryptjs password hashing, database-verified role-based access control
- **Security**: Helmet headers, CORS origin verification, express-rate-limit
- **File Uploads**: Multer memory storage + Cloudinary document handling with data URI fallback
- **Real-Time Architecture**: 1-second short polling for live bidding leaderboards and auctions
- **Background Jobs**: Node-cron worker running every 5 seconds for automatic time-based status transitions

---

## 📁 Project Structure

```
freightbid-server/
├── src/
│   ├── config/
│   │   ├── db.js             # Mongoose connection & embedded persistent DB
│   │   └── cloudinary.js     # Cloudinary SDK & document uploader
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── publicController.js
│   │   ├── shipmentController.js
│   │   └── transporterController.js
│   ├── jobs/
│   │   └── statusCron.js     # Shipment status transition scheduler (every 5s)
│   ├── middleware/
│   │   ├── auth.js           # JWT verification & active status enforcer
│   │   ├── errorHandler.js   # Centralized JSON error response handler
│   │   ├── upload.js         # Multer configuration with MIME & size checks
│   │   └── validate.js       # Express-validator result processing
│   ├── models/
│   │   ├── Bid.js            # Compound indexed bid model with history
│   │   ├── Review.js         # Shipment review model
│   │   ├── Shipment.js       # Comprehensive logistics shipment model
│   │   └── User.js           # Role-based user model with documents
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── publicRoutes.js
│   │   └── shipmentRoutes.js
│   ├── seed/
│   │   └── seed.js           # Multi-role realistic seed dataset
│   ├── services/
│   │   └── shipmentService.js# Status derivation and leaderboard calculation
│   ├── utils/
│   │   └── constants.js      # Roles, statuses, and milestone constants
│   ├── app.js                # Express application configuration
│   └── server.js             # HTTP server entry point
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server listening port | `5000` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |
| `MONGO_URI` | MongoDB connection URI | `mongodb://127.0.0.1:27017/freightbid` |
| `JWT_SECRET` | Secret key for JWT signing | `supersecretfreightbidjwtkey...` |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `CLIENT_URL` | Allowed client origin(s) (comma-separated) | `http://localhost:5173` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name (optional in dev) | `demo` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `""` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `""` |

### 3. Seed Database
Seeds 1 Admin, 3 Suppliers, 5 Transporters, 2 Pending users, 1 Blocked user, and shipments across all states:
```bash
npm run seed
```

### 4. Run the Server
```bash
# Development mode with file watching
npm run dev

# Production mode
npm start
```

---

## 🔐 Demo Credentials

| Role | Email | Password | Status |
|---|---|---|---|
| **Admin** | `admin@freightbid.com` | `Admin@123` | VERIFIED |
| **Supplier 1** | `supplier1@apexlogistics.com` | `Supplier@123` | VERIFIED |
| **Supplier 2** | `supplier2@bharatfab.com` | `Supplier@123` | VERIFIED |
| **Supplier 3** | `supplier3@omniagri.com` | `Supplier@123` | VERIFIED |
| **Transporter 1** | `transporter1@delhifleet.com` | `Transporter@123` | VERIFIED |
| **Transporter 2** | `transporter2@maharashtraexpress.com` | `Transporter@123` | VERIFIED |
| **Transporter 3** | `transporter3@southcorridor.com` | `Transporter@123` | VERIFIED |
| **Transporter 4** | `transporter4@gujaratfreight.com` | `Transporter@123` | VERIFIED |
| **Transporter 5** | `transporter5@speedways.com` | `Transporter@123` | VERIFIED |
| **Pending Carrier** | `pending1@karnatakacargo.com` | `Pending@123` | PENDING |
| **Blocked Carrier** | `blocked@roguehaulage.com` | `Blocked@123` | BLOCKED |

---

## 📖 Business Rules & Logic

1. **User Lifecycle & Real-Time Security**:
   - Only `VERIFIED` users can access protected routes.
   - User status is verified from the database on **every single request**. Blocking or deleting a user invalidates their existing session immediately.
2. **Shipment Lifecycle**:
   - Status transitions: `UPCOMING` &rarr; `OPEN` &rarr; `CLOSED` / `EXPIRED` &rarr; `AWARDED` &rarr; `IN_PROGRESS` &rarr; `DELIVERED`.
   - Transitions are calculated server-side upon read/write operations and persisted every 5 seconds by `node-cron`.
   - If an auction closes with zero bids, it becomes `EXPIRED`. Suppliers can repost it.
3. **Bidding & Tie-Breaking Rules**:
   - Bids are only accepted when shipment status is `OPEN`.
   - If `basePrice` is defined, bids above it are rejected.
   - Bidders can revise bids freely (higher or lower) while the auction is open.
   - Rank is sorted by `amount` ascending (lowest bid = Rank 1).
   - **Tie-Breaking**: If amounts match, the earlier `lastAmountChangedAt` wins. Modifying a bid updates `lastAmountChangedAt`; submitting the exact same amount does not reset the timer.
4. **Awarding**:
   - Only available when shipment is `CLOSED`.
   - The supplier can choose **any** bidder (not required to pick the lowest).
   - Atomic operation marks winning bid `WON`, all others `LOST`, and shipment `AWARDED`.
5. **Milestone Tracking**:
   - Strictly sequential: `Awarded` &rarr; `Pickup Scheduled` &rarr; `Picked Up` &rarr; `In Transit` &rarr; `Out for Delivery` &rarr; `Delivered`.
   - No skipping or reversing milestones.
6. **Reviews**:
   - Only after `DELIVERED`, only by the owning supplier, maximum 1 review per shipment (1–5 stars).

---

## 📡 REST API Reference (`/api`)

### Health
- `GET /api/health` - Server uptime & health check

### Public
- `GET /api/public/home` - Top-rated transporters, recent reviews, platform stats

### Authentication
- `POST /api/auth/register` - Multipart registration (documents, company profile)
- `POST /api/auth/login` - Authenticate & receive Bearer JWT
- `GET /api/auth/me` - Fetch profile of current authenticated user
- `POST /api/auth/logout` - Clear user session

### Admin (Requires `ADMIN` role)
- `GET /api/admin/users` - Paginated user list with filter & search
- `GET /api/admin/users/:id` - Fetch user details & documents
- `PATCH /api/admin/users/:id/verify` - Approve registration
- `PATCH /api/admin/users/:id/reject` - Reject registration with reason
- `PATCH /api/admin/users/:id/block` - Block user immediately
- `PATCH /api/admin/users/:id/unblock` - Unblock user
- `DELETE /api/admin/users/:id` - Soft-delete user
- `GET /api/admin/shipments` - Read-only list of all platform shipments
- `GET /api/admin/stats` - Platform statistical totals

### Supplier (Requires `SUPPLIER` role)
- `POST /api/shipments` - Create shipment with bidding window
- `GET /api/shipments/mine` - List supplier's shipments
- `GET /api/shipments/:id` - Shipment details
- `PUT /api/shipments/:id` - Edit shipment (only before `biddingStart`)
- `POST /api/shipments/:id/repost` - Repost an `EXPIRED` shipment
- `GET /api/shipments/:id/bids` - Live bid list
- `POST /api/shipments/:id/award` - Award shipment (`{ bidId }`)
- `POST /api/shipments/:id/review` - Review transporter (`{ rating, comment }`)

### Transporter (Requires `TRANSPORTER` role)
- `GET /api/shipments` - Browse open/upcoming shipments with filters
- `POST /api/shipments/:id/bids` - Place bid (`{ amount }`)
- `PUT /api/shipments/:id/bids/me` - Update existing bid (`{ amount }`)
- `GET /api/shipments/:id/leaderboard` - Live 1s polled leaderboard
- `GET /api/shipments/awarded/mine` - List shipments awarded to carrier
- `GET /api/shipments/my-bids` - List carrier's active & past bids
- `PATCH /api/shipments/:id/milestone` - Sequential milestone advance (`{ milestone, note }`)
