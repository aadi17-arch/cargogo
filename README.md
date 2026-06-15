# 🚀 CargoGo | Real-Time B2B Cargo Aggregator & Dispatcher

CargoGo is a premium, high-performance "Mission Control" dispatching and matching platform for B2B logistics. It connects Shippers with real-time driver fleets, utilizing persistent background queues, geospatial indexing, and WebSocket synchronization to automate the cargo lifecycle from booking to double-OTP verified delivery.

---

## 🏗️ Technical Architecture & Design System

The system is designed with a **High-Contrast Dark Mode Bento Grid** aesthetic. It leverages glassmorphic panels, glowing neon indicators, and modular layouts to minimize cognitive load and provide clear visual hierarchies.

```mermaid
graph TD
    A[Vite React Frontend] <-->|WebSockets & REST API| B[Express + TS Server]
    B <-->|ORM| C[Prisma + PostgreSQL]
    B <-->|Geospatial Indexing| D[Redis Cache]
    B <-->|Job Pipeline| E[BullMQ Worker]
```

### Key Technical Specs:
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Redis, BullMQ, Socket.io.
- **Frontend**: React (Vite), Redux Toolkit, Tailwind CSS, Leaflet Maps, Socket.io-client.
- **Design Tokens**: Obsidian base background (`#030303`), card surfaces (`#0c0c0e`), and Electric Cyan (`#00f0ff`) primary neon highlights.

---

## 🌟 Core System Features

### 1. Geospatial Driver Tracking & Proximity Matching
- **Redis Geohash Indexing**: Active driver coordinates are dynamically indexed in a Redis geospatial sorted set (`drivers:online`) using `GEOADD`.
- **Search Optimization**: Shippers' bookings query nearby active drivers within a **5km search radius** using low-latency `GEORADIUS` lookup queries.
- **HTML5 Geolocation Integration**: Drivers stream their real-time device GPS coordinates to ensure perfect alignment with pickup and transit tracking.

### 2. BullMQ Persistent Dispatching
- **Queued Bid Routing**: Rather than using volatile memory timers, the dispatch system runs on a Redis-backed **BullMQ** job pipeline.
- **Cascading Offers**: Bids are dispatched sequentially to the closest driver. If a driver declines or fails to respond within **30 seconds**, the worker automatically falls back, dequeues the job, and routes the bid to the next nearest driver in the array.

### 3. Volumetric Pricing Engine
- **Dynamic Valuation**: A pricing engine calculates transport costs based on the maximum of **Actual Weight vs. Volumetric Weight** ($Length \times Width \times Height / 5000$).
- **Mileage Estimation**: Uses coordinate-based distance mapping multiplied by vehicle-specific tariff coefficients (ranging from 2-wheelers to heavy-duty container trucks).

### 4. Double-OTP Handshake Verification
- **Chain of Custody**: To guarantee secure transit and prevent disputes, two separate OTPs are generated on booking:
  - **Pickup OTP**: Shared by the shipper; verified by the driver to transition the shipment to `IN_TRANSIT` status.
  - **Drop-off OTP**: Shared by the receiver; verified by the driver to transition the shipment to `DELIVERED` status.
- **State Machine Integrity**: Enforces strict database transaction status overrides (`PENDING` ➔ `ACCEPTED` ➔ `IN_TRANSIT` ➔ `DELIVERED` ➔ `COMPLETED`).

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
│       ├── services           # Business logic (OTP, Pricing, Matching, GPS simulation)
│       ├── sockets            # Real-time WebSocket event registries
│       └── app.ts             # App bootstrapper
└── frontend
    └── src
        ├── components         # Shared UI assets and layout components
        ├── hooks              # Redux hooks and Socket callbacks (useSocket, useDriverStatus)
        ├── pages              # Dashboards (Shipper, Driver, Tracking)
        ├── services           # REST API client and Socket bridges
        └── utils              # App constants (base URLs, rates)
```

---

## ⚡ Setup & Installation

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Redis Database (e.g. Local Server, Docker Container, or [Upstash Cloud](https://upstash.com/))

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
   DATABASE_URL="postgresql://postgres:password@localhost:5432/cargogo"
   REDIS_URL="redis://localhost:6379"  # Or your Upstash/Cloud Redis URL
   JWT_ACCESS_SECRET="your_secret_key"
   ```
4. Run migrations and seed the database:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
5. Start the server:
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
3. Verify connection configuration in `src/utils/constants.ts`:
   ```typescript
   export const BASE_URL = 'http://localhost:5000';
   export const SOCKET_URL = 'http://localhost:5000';
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🧪 Testing Account Credentials
Use these pre-seeded accounts to test the shipper-to-driver workflow:

- **Password (All Accounts)**: `123456`
- **Shipper Accounts**: `s1@g.com` / `s2@g.com`
- **Driver Accounts**: `d1@g.com` / `d2@g.com`
