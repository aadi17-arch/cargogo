<div align="center">

# 🚛 CargoGo

### **Mission-Control B2B Cargo Dispatch & Real-Time Logistics Matching Platform**

*"Autonomous Driver Proximity Matching — Cascading BullMQ Pipelines, Double-OTP Custody Handshakes, Dynamic Volumetric Pricing & VRP Multi-Stop Optimization."*

<br/>

[![Production](https://img.shields.io/badge/PRODUCTION-LIVE-22c55e?style=for-the-badge&logo=vercel&logoColor=white)](https://cargogo-six.vercel.app)
[![Node.js](https://img.shields.io/badge/NODE.JS-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/REACT-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TYPESCRIPT-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/POSTGRESQL-NEON-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech)
[![Redis](https://img.shields.io/badge/REDIS-UPSTASH-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://upstash.com)
[![Tailwind CSS](https://img.shields.io/badge/TAILWIND-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

<br/>

[**Live Demo**](https://cargogo-six.vercel.app) • [**Backend API**](https://cargogo-ntwr.onrender.com) • [**Architecture Overview**](#-technology-stack--architecture) • [**Quick Start Guide**](#-quick-start)

</div>

---

## 🌟 Overview

**CargoGo** is an enterprise-grade, high-performance logistics orchestration platform and intelligent cargo dispatching engine. It bridges the trust and efficiency gap between commercial shippers and freight driver fleets by automating the entire shipment lifecycle from quote calculation to verified delivery.

Shipments are routed through an automated geospatial matching pipeline backed by **Redis Geohash Indexing** and **BullMQ persistent job queues**. The platform guarantees strict chain-of-custody verification using **Double-OTP cryptographic handshakes** at pickup and drop-off, eliminating cargo loss and dispute friction.

---

## ⚡ Key Highlights & Production Architecture

### 📍 1. Geospatial Driver Tracking & Proximity Matching
- **Redis Geohash Indexing**: Active driver coordinates are indexed dynamically in Redis geospatial sorted sets (`drivers:online`) using `GEOADD`.
- **Low-Latency Search**: Shippers' bookings query nearby available drivers within a **5 km radius** using sub-millisecond `GEORADIUS` lookups.
- **Real-Time GPS Streaming**: Drivers continuously stream live coordinates over WebSockets for live turn-by-turn tracking on interactive Leaflet maps.

### ⏱️ 2. BullMQ Persistent Cascading Dispatch
- **Queued Bid Routing**: Replaces volatile in-memory timers with a persistent, Redis-backed **BullMQ** worker pipeline.
- **Cascading Offers**: Dispatch jobs are routed sequentially to the closest driver. If a driver declines or fails to accept within **30 seconds**, the worker automatically dequeues the job and escalates the offer to the next closest candidate in the array.

### 🛣️ 3. VRP Multi-Stop Route Optimization
- **Vehicle Routing Problem Heuristics**: Integrated Nearest-Neighbor route sequencing for multi-stop pickups and deliveries with dynamic vehicle payload validation.
- **Scheduled & Instant Modes**: Supports both instant matching and scheduled forward-booked cargo slots with automated calendar conflict prevention.

### 💰 4. Dynamic Volumetric Pricing Engine
- **Volumetric Valuation**: Automatically calculates freight tariffs based on the greater of **Actual Weight vs. Volumetric Weight** ($\text{Length} \times \text{Width} \times \text{Height} / 5000$).
- **Mileage Estimation**: Uses coordinate-based distance mapping multiplied by vehicle-specific tariff coefficients across 6 vehicle tiers (2-wheelers up to heavy-duty trucks).

### 🔐 5. Double-OTP Chain-of-Custody Verification
- **Pickup Verification OTP**: Shipper provides a unique OTP to the driver to authenticate parcel pickup and transition status to `IN_TRANSIT`.
- **Drop-off Verification OTP**: Receiver provides the completion OTP to verify final parcel handover and transition status to `DELIVERED`.
- **Strict State Machine**: Enforces atomic state transitions (`PENDING` ➔ `ACCEPTED` ➔ `IN_TRANSIT` ➔ `DELIVERED` ➔ `COMPLETED`).

---

## 🛠️ Technology Stack & Architecture

```mermaid
graph TD
    A[React 18 + Vite + Tailwind CSS] <-->|REST API + Axios| B[Node.js + Express TypeScript Engine]
    A <-->|WebSocket Events| B
    B <-->|Prisma ORM| C[Neon PostgreSQL Database]
    B <-->|Geospatial Indexing & Pub/Sub| D[Upstash Redis Cache]
    B <-->|Persistent Dispatch Pipeline| E[BullMQ Worker Service]
```

<br/>

| Layer | Technologies & Tools |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Redux Toolkit, Leaflet Maps, Lucide Icons, Axios |
| **Backend** | Node.js, Express.js, TypeScript, `tsc-alias`, Argon2, JWT, Helmet, Rate Limiter |
| **Database & ORM** | PostgreSQL (Neon Serverless), Prisma ORM |
| **Caching & Queues** | Redis (Upstash Cloud), BullMQ Background Job Worker, Redis Geohash |
| **Real-Time Sockets** | Socket.IO, `@socket.io/redis-adapter` |
| **Deployments** | Vercel (Frontend SPA), Render (Backend Service) |

---

## 🚀 API Architecture

| Endpoint Category | Method & Route | Description |
| :--- | :--- | :--- |
| **Auth** | `POST /api/auth/register` | Register new Shipper or Driver account |
| **Auth** | `POST /api/auth/login` | Authenticate user and issue JWT tokens & HTTP cookies |
| **Auth** | `POST /api/auth/refresh` | Refresh access token using secure refresh cookie |
| **Bookings** | `POST /api/bookings` | Create new instant or scheduled cargo shipment |
| **Bookings** | `GET /api/bookings/my` | List all historical and active shipments for authenticated user |
| **Bookings** | `GET /api/bookings/:id` | Fetch full shipment details and live status |
| **Drivers** | `GET /api/drivers/nearby` | Query nearby active drivers within specified kilometer radius |
| **Drivers** | `PATCH /api/drivers/status` | Update driver availability status (`isOnline`, coordinates) |
| **Tracking** | `POST /api/bookings/:id/verify-otp` | Verify pickup or drop-off OTP to advance shipment state |
| **Payments** | `POST /api/payment/create-intent` | Initialize secure Stripe/Mock payment transaction |
| **Chat** | `GET /api/chat/:bookingId` | Fetch message history between driver and shipper |
| **Health** | `GET /api/health` | Service uptime and system health check |

---

## 🚦 Quick Start

### Prerequisites
- **Node.js** `v18+`
- **PostgreSQL Database** (or [Neon.tech](https://neon.tech) connection URL)
- **Redis Database** (or [Upstash](https://upstash.com) connection URL)

---

### 1. Clone the Repository
```bash
git clone https://github.com/aadi17-arch/cargogo.git
cd cargogo
```

---

### 2. Configure Environment Variables

#### Backend (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
JWT_SECRET="your_strong_jwt_secret_key"
REDIS_URL="rediss://default:password@host:6379"
FRONTEND_URL="http://localhost:3000"
```

#### Frontend (`frontend/.env` - optional):
```env
VITE_API_URL="http://localhost:5000"
VITE_WS_URL="http://localhost:5000"
```

---

### 3. Install & Start Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

---

### 4. Install & Start Frontend
```bash
cd ../frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or `http://localhost:5173`) in your browser.

---

## 🧪 Testing Account Credentials

Pre-seeded testing credentials for immediate login:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Shipper** | `s1@g.com` | `123456` | John Shipper |
| **Shipper 2** | `s2@g.com` | `123456` | Alice Shipper |
| **Driver** | `d1@g.com` | `123456` | Robert Driver (Mini Tempo, 1000kg) |
| **Driver 2** | `d2@g.com` | `123456` | Michael Driver (Pickup Truck, 2000kg) |

---

## 🧪 Testing & Verification

Run the integration and pricing test suite:

```bash
cd backend
npm test
```

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">

Built with ❤️ for high-performance freight logistics.

</div>
