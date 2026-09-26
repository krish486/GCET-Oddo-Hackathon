# StockSense Inventory Management System

StockSense is a full-stack inventory transaction application. It tracks quantity by product and location, records every completed movement in an immutable stock ledger, and exposes a dashboard for inventory health and pending work.

## Run locally

Requirements: Node.js 20 or later.

1. Start the API.

   ```powershell
   cd backend
   Copy-Item .env.example .env
   npm install
   npm run dev
   ```

2. In a second terminal, start the client.

   ```powershell
   cd Client
   Copy-Item .env.example .env
   npm install
   npm run dev
   ```

Open `http://localhost:5173`. The seeded manager account is `manager@stocksense.app` with password `Demo123!`. Run `npm run seed` from `backend` to restore the demo data.

## Environment variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `PORT` | API | HTTP port, defaults to `4000` |
| `CLIENT_ORIGIN` | API | Allowed frontend origin for CORS |
| `JWT_SECRET` | API | Signing secret for access and password-reset tokens |
| `DATA_FILE` | API | Optional location for the JSON data store |
| `VITE_API_URL` | Client | API base URL, defaults to `http://localhost:4000/api` |

The application uses a JSON data store so it can run without a database service. Set `DATA_FILE` when separate demo or test datasets are useful.

## Main workflows

- Managers create categories, products, warehouses, and locations. Products can include opening stock at a chosen location.
- Warehouse staff or managers create receipt, delivery, transfer, and adjustment documents. Stock changes only when a document is validated.
- A delivery can move through Draft, Waiting (picked), Ready (packed), and Done. Receipts, transfers, and adjustments validate directly from Draft.
- Every validated movement updates the product-location balance and appends an entry to the Stock Ledger. A transfer writes both its outgoing and incoming movements while keeping total quantity unchanged.

## API reference

All API responses use `{ success, message, data }`. Protected routes require `Authorization: Bearer <token>`.

| Group | Endpoints |
| --- | --- |
| Authentication | `POST /api/auth/signup`, `/login`, `/forgot-password`, `/verify-otp`, `/reset-password`; `POST /api/auth/logout`; `GET /api/auth/me`; `PATCH /api/profile` |
| Catalog | `GET, POST /api/categories`; `GET, POST /api/products`; `GET, PATCH /api/products/:id` |
| Storage | `GET, POST /api/warehouses`; `GET, POST /api/locations`; `GET /api/stock` |
| Operations | `GET, POST /api/receipts`, `/deliveries`, `/transfers`, `/adjustments`; `GET /api/:type/:id`; `PATCH /api/:type/:id/validate`; delivery also supports `/pick` and `/pack` |
| Insight | `GET /api/ledger`, `GET /api/dashboard` |

## Verification

Run the API integration suite with:

```powershell
cd backend
npm test
```

It verifies the critical receipt, transfer, delivery, adjustment, stock-balance, ledger, authentication, and insufficient-stock flows.
