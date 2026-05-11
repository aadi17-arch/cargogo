# CargoGo 🚚

On-demand B2B commercial cargo transport aggregator connecting businesses (Shippers) with truck/tempo owners (Drivers) in real-time.

## Tech Stack
- **Frontend**: React (Vite, TypeScript, Tailwind CSS, Leaflet.js)
- **Backend**: Node.js (Express, TypeScript, Socket.io, Prisma ORM, PostgreSQL, Redis)
- **Shared**: Common TypeScript type definitions

## Project Setup & Running
1. Run local database & caching infrastructure:
   ```bash
   docker-compose up -d
   ```
2. Install dependencies:
   ```bash
   npm run install:all
   ```
3. Run development mode (Frontend & Backend simultaneously):
   ```bash
   npm run dev
   ```
