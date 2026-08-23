# 🚀 CargoGo | Real-Time B2B Cargo Aggregator & Dispatcher

CargoGo is a high-performance "Mission Control" dispatching, multi-stop routing, and cargo tracking platform for B2B logistics. It connects Shippers with real-time driver fleets, utilizing persistent background queues, geospatial indexing, Vehicle Routing Problem (VRP) optimization, and WebSocket synchronization to automate the cargo lifecycle from booking to double-OTP verified delivery.

---

## 🏗️ Technical Architecture & Design System

The system is designed with a **High-Contrast Dark Logistics Grid** aesthetic, leveraging glassmorphic panels, glowing route corridors, live transit waypoints, and modular Bento layouts.

```mermaid
graph TD
    A[Vite + React Frontend] <-->|WebSockets & REST API| B[Express + TS Server]
    B <-->|ORM| C[Prisma + PostgreSQL]
    B <-->|Geospatial Indexing & Pub/Sub| D[Redis Cache]
    B <-->|Job Pipeline| E[BullMQ Worker]
```

### Key Technical Specs:
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL (Neon / Supabase), Redis (Upstash / Local), BullMQ, Socket.io, `tsc-alias`.
- **Frontend**: React 18 (Vite), Redux Toolkit, Tailwind CSS, Leaflet Maps, Socket.io-client, Lucide Icons.
- **Production Deployments**: Vercel (Frontend SPA) + Render (Backend Web Service).

---

## 🌟 Core System Features

### 1. Geospatial Driver Tracking & Proximity Matching
- **Redis Geohash Indexing**: Active driver coordinates are indexed in a Redis geospatial sorted set (`drivers:online`) using `GEOADD`.
- **Search Optimization**: Shippers' bookings query nearby active drivers within a **5km search radius** using low-latency `GEORADIUS` lookup queries.
- **HTML5 Geolocation Integration**: Drivers stream their real-time device GPS coordinates to ensure perfect alignment with pickup and transit tracking.

### 2. BullMQ Persistent Dispatching
- **Queued Bid Routing**: Rather than volatile memory timers, the dispatch system runs on a Redis-backed **BullMQ** job pipeline.
- **Cascading Offers**: Bids are dispatched sequentially to the closest driver. If a driver declines or fails to respond within **30 seconds**, the worker automatically dequeues the job and routes the bid to the next nearest driver in the array.

### 3. VRP Multi-Stop Route Optimization
- **Vehicle Routing Heuristics**: Integrated Nearest-Neighbor route sequencing for multi-order pickups and drop-offs while verifying dynamic vehicle payload capacity.
- **Scheduled & Instant Modes**: Supports both instant matching and scheduled forward-booked cargo slots with automated conflict detection.

### 4. Volumetric Pricing Engine
- **Dynamic Valuation**: A pricing engine calculates transport costs based on the maximum of **Actual Weight vs. Volumetric Weight** ($\text{Length} \times \text{Width} \times \text{Height} / 5000$).
- **Mileage Estimation**: Uses coordinate-based distance mapping multiplied by vehicle-specific tariff coefficients (2-wheelers, mini tempos, pickup trucks, and 3-ton to heavy-duty container trucks).

### 5. Double-OTP Handshake Verification
- **Chain of Custody**: To guarantee secure transit and prevent disputes, two separate OTPs are generated on booking:
  - **Pickup OTP**: Shared by the shipper; verified by the driver to transition the shipment to `IN_TRANSIT` status.
  - **Drop-off OTP**: Shared by the receiver; verified by the driver to transition the shipment to `DELIVERED` status.
- **Strict State Machine**: Enforces strict database transaction status overrides (`PENDING` ➔ `ACCEPTED` ➔ `IN_TRANSIT` ➔ `DELIVERED` ➔ `COMPLETED`).

---

## 📁 Repository Structure

```text
├── backend
│   ├── prisma
│   │   ├── schema.prisma      # Relational schemas (Users, Profiles, Vehicles, Bookings, Sessions)
│   │   └── seed.ts            # Seeding scripts for test accounts and locations
│   └── src
│       ├── config             # Redis, Database, and Environment configurations
│       ├── controllers        # HTTP request controllers (Auth, Bookings, Drivers, Vehicles)
│       ├── middleware         # Rate limiting, Auth authentication, Logger, and Errors
│       ├── queues             # BullMQ dispatcher queue & worker pipelines
│       ├── services           # Business logic (VRP, OTP, Pricing, Matching, GPS simulation)
│       ├── sockets            # Real-time WebSocket event registries (Matching, Tracking)
│       └── app.ts             # App bootstrapper
└── frontend
    └── src
        ├── components
        │   ├── booking        # BookingForm, AddressSearchInput
        │   ├── dashboard      # ShipmentsList, PaymentModal
        │   ├── driver         # JobsBoard, ActiveTrips, ScheduledJobs, BidModal
        │   ├── landing        # HeroSection (Animated SVG), PricingSection, TrackSection
        │   ├── layout         # Navbar, DriverNavbarOptions, ShipperNavbarOptions
        │   ├── map            # MapView, MapViewHelper
        │   ├── tracking       # ChatDrawer, OtpPanel, OtpVerifyInput, PostDelivery
        │   └── ui             # Reusable primitives (Card, Button, Modal, FormField, Badge, etc.)
        ├── hooks              # Redux hooks, useAuth, useBooking, useSocket
        ├── pages              # LandingPage, LoginPage, RegisterPage, Dashboards, TrackingPage
        ├── services           # REST API client and Socket bridges
        └── utils              # App constants (BASE_URL, SOCKET_URL, rates)
```

---

## ⚡ Setup & Installation

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database (Local or Neon / Supabase)
- Redis Database (Local or Upstash Cloud)

### 1. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `backend/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="postgresql://user:password@localhost:5432/cargogo"
   REDIS_URL="redis://localhost:6379"
   JWT_SECRET="your_secure_jwt_secret_key"
   FRONTEND_URL="http://localhost:3000"
   ```
4. Sync database schema and seed test data:
   ```bash
   npx prisma db push
   npm run db:seed
   ```
5. Start the backend server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Optional: Create `frontend/.env` for custom backend endpoints:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_WS_URL=http://localhost:5000
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

---

## 🧪 Demo Test Credentials

Pre-seeded testing credentials for immediate login:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Shipper** | `s1@g.com` | `123456` | John Shipper |
| **Shipper 2** | `s2@g.com` | `123456` | Alice Shipper |
| **Driver** | `d1@g.com` | `123456` | Robert Driver (Mini Tempo, 1000kg) |
| **Driver 2** | `d2@g.com` | `123456` | Michael Driver (Pickup Truck, 2000kg) |

---

## 🚀 Production Deployment Reference

### 🌐 Vercel (Frontend SPA)
- **Root Directory**: `frontend`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: `https://cargogo-ntwr.onrender.com`
  - `VITE_WS_URL`: `https://cargogo-ntwr.onrender.com`

### ⚙️ Render (Backend Service)
- **Root Directory**: `backend`
- **Build Command**: `npm install --legacy-peer-deps && npx prisma generate && npm run build`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `FRONTEND_URL`: `https://cargogo-six.vercel.app`
  - `DATABASE_URL`: *(Your PostgreSQL Connection String)*
  - `REDIS_URL`: *(Your Redis Connection String)*
  - `JWT_SECRET`: *(Your Secret Key)*
