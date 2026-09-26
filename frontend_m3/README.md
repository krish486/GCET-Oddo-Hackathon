# Member 3 — Inventory Operations (Receipts, Deliveries, Transfers, Adjustments)

This folder contains everything for your part of the hackathon project,
already laid out to match the team's agreed folder structure. Copy the
`backend/` and `frontend/` contents into the matching folders in the
team repo (see the git guide at the bottom of the chat message).

## What's real vs. placeholder

**Real (your part, fully implemented):**
- `backend/src/models/{Receipt,Delivery,Transfer,Adjustment}.js`
- `backend/src/services/{receipt,delivery,transfer,adjustment}.service.js`
- `backend/src/services/stockMutation.service.js` — the shared engine that
  actually increases/decreases stock and writes the ledger, used by all 4
  operations above (this is the "core business logic" part of your role)
- `backend/src/controllers/*.controller.js`
- `backend/src/routes/*.routes.js`
- `backend/src/validators/*.validator.js`
- `frontend/src/features/{receipts,deliveries,transfers,adjustments}/**`

**Placeholders — replace with the real files once teammates push theirs:**
- `backend/src/models/Stock.js`, `backend/src/models/StockLedger.js` —
  normally owned by whoever builds Products/Warehouses/Ledger
- `backend/src/middleware/auth.middleware.js` — owned by the auth teammate
- `backend/src/middleware/validation.middleware.js` — generic, whoever sets
  up shared middleware
- `frontend/src/shared/api/client.js` — the shared axios instance
- Every page's `warehouses`/`products` arrays are empty placeholders —
  wire them up to the real `useWarehouses()` / `useProducts()` hooks once
  that feature exists on the branch you merge into

None of this changes your logic — it just means you can `npm run dev` and
test your own screens **today**, before the rest of the team has pushed.

## Backend dependencies you'll need

```bash
cd backend
npm install express mongoose joi jsonwebtoken dotenv cors
npm install --save-dev nodemon
```

## Mounting your routes (backend/src/routes/index.js)

Your teammate who owns `routes/index.js` needs one line per resource.
If that file doesn't exist yet, here's the shape:

```js
const express = require('express');
const router = express.Router();

router.use('/receipts', require('./receipt.routes'));
router.use('/deliveries', require('./delivery.routes'));
router.use('/transfers', require('./transfer.routes'));
router.use('/adjustments', require('./adjustment.routes'));
// ...other teammates' routes (auth, products, warehouse, dashboard, ledger)

module.exports = router;
```

And in `app.js`:
```js
app.use('/api', require('./routes'));
```

## Frontend dependencies you'll need

```bash
cd frontend
npm install @reduxjs/toolkit react-redux axios react-router-dom
```

## Wiring your redux slices (frontend/src/store/store.js)

```js
import { configureStore } from '@reduxjs/toolkit';
import receiptReducer from '../features/receipts/state/receiptSlice';
import deliveryReducer from '../features/deliveries/state/deliverySlice';
import transferReducer from '../features/transfers/state/transferSlice';
import adjustmentReducer from '../features/adjustments/state/adjustmentSlice';

export const store = configureStore({
  reducer: {
    receipts: receiptReducer,
    deliveries: deliveryReducer,
    transfers: transferReducer,
    adjustments: adjustmentReducer,
    // ...other teammates' reducers
  },
});
```

## Wiring your routes (frontend/src/app/routes.jsx)

```jsx
import Receipts from '../features/receipts/pages/Receipts';
import CreateReceipt from '../features/receipts/pages/CreateReceipt';
import ReceiptDetails from '../features/receipts/pages/ReceiptDetails';

import Deliveries from '../features/deliveries/pages/Deliveries';
import CreateDelivery from '../features/deliveries/pages/CreateDelivery';
import DeliveryDetails from '../features/deliveries/pages/DeliveryDetails';

import Transfers from '../features/transfers/pages/Transfers';
import CreateTransfer from '../features/transfers/pages/CreateTransfer';
import TransferDetails from '../features/transfers/pages/TransferDetails';

import Adjustments from '../features/adjustments/pages/Adjustments';
import CreateAdjustment from '../features/adjustments/pages/CreateAdjustment';

// inside your <Routes> (react-router-dom v6):
<Route path="/receipts" element={<Receipts />} />
<Route path="/receipts/new" element={<CreateReceipt />} />
<Route path="/receipts/:id" element={<ReceiptDetails />} />

<Route path="/deliveries" element={<Deliveries />} />
<Route path="/deliveries/new" element={<CreateDelivery />} />
<Route path="/deliveries/:id" element={<DeliveryDetails />} />

<Route path="/transfers" element={<Transfers />} />
<Route path="/transfers/new" element={<CreateTransfer />} />
<Route path="/transfers/:id" element={<TransferDetails />} />

<Route path="/adjustments" element={<Adjustments />} />
<Route path="/adjustments/new" element={<CreateAdjustment />} />
```

## How the core logic works (so you can explain it in the demo/judging)

Every operation is: **create (draft) → validate → stock changes + ledger entry.**

- `stockMutation.service.js` is the only file that touches the `Stock`
  collection. `increaseStock`, `decreaseStock`, and `setStock` are the only
  three ways stock numbers move in the whole app, and each one also writes
  a `StockLedger` row in the *same* database transaction, so stock and its
  audit trail can never go out of sync.
- **Receipt.validate** → `increaseStock` (goods arrived).
- **Delivery.validate** → `decreaseStock`, which fails atomically if stock
  is insufficient (`quantity: { $gte: quantity }` guard — this also
  prevents two concurrent deliveries from over-selling the same stock).
- **Transfer.validate** → `decreaseStock` at the source, then
  `increaseStock` at the destination, both in one transaction — so a
  transfer never leaves stock in a half-moved state.
- **Adjustment.validate** → `setStock`, which computes and logs the signed
  difference between system and counted quantity.

Everything happens inside `withTransaction()` (a Mongo session), so if
anything fails partway, the whole operation rolls back — no partial stock
updates.
