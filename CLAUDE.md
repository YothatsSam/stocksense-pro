# StockSense Pro — Project Memory

## What This Is
Multi-tenant SaaS inventory optimisation platform for three business types:
- **Retail chains**
- **Restaurants**
- **Distribution centres**

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express (plain SQL via `pg`, no ORM) |
| Frontend | React + TypeScript + Tailwind CSS (Vite) |
| Database | PostgreSQL |

## Project Structure
```
C:/StockSensePRO/
├── CLAUDE.md           ← this file
├── backend/            ← Express REST API (port 3001)
└── frontend/           ← React SPA (port 5173, proxies /api → 3001)
```

## Database Tables
| Table | Purpose |
|-------|---------|
| `locations` | Stores/sites. Has `business_type` (retail/restaurant/distribution) |
| `products` | SKUs/items |
| `stock_levels` | quantity per product per location + `reorder_point` |
| `stock_movements` | Immutable history of every stock change |
| `suppliers` | Supplier directory |
| `purchase_orders` | Orders raised against suppliers |

## Core API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/stock` | All stock levels (joined with product + location) |
| POST | `/api/stock/adjust` | Adjust quantity; writes a movement record |
| GET | `/api/alerts` | Items where `quantity < reorder_point` |

## Phase Roadmap
- **Phase 1 (current):** Project scaffold, schema, core API, basic dashboard
- **Phase 2:** Multi-tenant auth, per-business-type rules, forecasting
- **Phase 3:** Supplier integrations, auto purchase orders, analytics

## Dev Setup
```bash
# Backend
cd backend && npm install
cp .env.example .env   # fill in your DB credentials
node src/index.js

# Frontend
cd frontend && npm install
npm run dev
```

## Key Decisions
- Raw SQL (`pg`) chosen over an ORM for transparency and query control
- `reorder_point` lives on `stock_levels` (per location, per product) — more flexible than a global threshold
- `business_type` on `locations` is the multi-tenant hook for Phase 2 rules
- Vite proxy rewrites `/api/*` to `http://localhost:3001` — no CORS issues in dev
