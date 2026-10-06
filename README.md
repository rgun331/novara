# Novara

Novara is a MERN-stack workspace for small product businesses. You can manage products, orders, customers and analytics in one place.

- **Landing page** with a split hero, a feature bento with a live SKU demo, a pinned GSAP workflow, testimonials, an FAQ and a 3D parcel scene (react-three-fiber).
- **Accounts**: sign up and log in. Users are stored in MongoDB, passwords are hashed with bcrypt and sessions use JWTs.
- **Dashboard**:
  - **Overview**: greeting, setup checklist, KPIs, revenue chart, restock list, recent orders and activity.
  - **Products**: table with search, filters, sort, bulk delete, CSV export, copy SKU and stock adjustment. Products are added or edited in a modal with image upload and an **automatic SKU generator**.
  - **Orders**: status tabs, search and CSV export. Orders are created in a modal with line items, live totals and stock reservation. A detail drawer shows the status flow, payment status and a timeline.
  - **Customers**: built automatically from orders, with segments (top, returning, new) and lifetime value.
  - **Analytics**: 7, 30 or 90 day and 12 month ranges. Shows KPIs with deltas, revenue and orders, status mix, top products, categories, channels, weekdays and inventory health.
  - **Notifications**: a bell with an unread badge, plus a full feed you can filter, mark read or unread, delete and clear. You get notifications for orders, low or out-of-stock products, product changes and account events.
  - **Settings**: profile and profile photo upload (cropped and compressed in the browser). Preferences cover currency, tax, SKU prefix, low stock level and notification toggles. Also: change password and delete account.
  - **Command palette** (Ctrl/Cmd + K) for live product and order search, quick actions and navigation.

## Stack

| Layer | Tech |
| --- | --- |
| Client | React 19, React Router 7, Vite, Tailwind CSS 4, GSAP + ScrollTrigger, Motion, Recharts, three.js / r3f, Phosphor Icons, Sonner |
| Server | Node.js, Express 5, Mongoose, JWT, bcrypt, Helmet |
| Database | MongoDB (local, Atlas or the bundled dev database) |

## Project layout

```
novara/
  client/   React app (Vite). The dev server proxies /api to the API.
  server/   Express API (auth, profile, products, orders, notifications, analytics)
  devdb/    Optional MongoDB-compatible dev server, saved to devdb/data (SQLite)
  scripts/  dev.mjs (runs everything) and smoke.mjs (end-to-end API check)
```

## Getting started

Requirements: Node 22.13 or newer (the dev database uses the built-in `node:sqlite`). A real MongoDB is optional.

```bash
npm run dev
```

That one command installs missing dependencies, starts the dev database on `:27017`, the API on `http://localhost:5000` and the app on `http://localhost:5173`. If one of them crashes it is restarted automatically.

### Demo account

In development the API creates a ready-made workspace on startup:

| Email | Password |
| --- | --- |
| `demo@novara.app` | `demo1234` |

It comes with 8 products, about 60 days of orders, customers and notifications, so the analytics have real data to show. The login page has an **Open demo** button. New sign-ups always start with an empty workspace. Turn the demo off with `SEED_DEMO=false`. In production it is off unless you set `SEED_DEMO=true`.

### Using a real MongoDB

```bash
cp server/.env.example server/.env   # set MONGODB_URI and JWT_SECRET
npm run server   # API
npm run client   # app
```

`npm run dev` also works: it skips the dev database when `MONGODB_URI` points at a remote host.

### Checking it works

```bash
npm run smoke                              # against the API on :5000
API_URL=http://127.0.0.1:5173 npm run smoke   # through the Vite proxy
```

The smoke test covers sign-up, login, a wrong password, product creation with an auto SKU, an order, stock reservation, analytics and notifications.

### Production (single port)

```bash
npm start        # builds the client and serves it from Express with SERVE_CLIENT=true
```

### Environment (`server/.env`)

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `5000` | API port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/novara` | Local MongoDB or Atlas |
| `JWT_SECRET` | dev value | **Set a long random string in production** |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `CLIENT_ORIGIN` | `*` | CORS origins, comma-separated |
| `SERVE_CLIENT` | `false` (`true` in production) | Serve `client/dist` from Express |
| `SEED_DEMO` | `true` in dev, `false` in production | Create the demo account on startup |

For the client, `VITE_API_PROXY` changes where Vite proxies `/api` (default `http://127.0.0.1:5000`).

### Resilience

- The API starts listening right away. Until the database connects (or while it reconnects), API calls return `503` with a clear message instead of hanging.
- The login and sign-up pages poll `/api/health` and show a "server is not responding" banner that clears on its own.
- The client turns gateway errors (502/503/504), HTML error pages and network failures into one friendly message, so raw proxy errors never reach the user.

> **About `devdb`:** it wraps `@rckflr/easydb-server` with a few compatibility patches. Data is saved as SQLite files in `devdb/data/` (gitignored) using a tiny `better-sqlite3` shim over Node's built-in `node:sqlite`, so accounts survive restarts. Delete that folder to start fresh, or run `node devdb/scripts/start.mjs --memory` for a throwaway in-memory database. It does not enforce unique indexes, but Novara checks email and SKU uniqueness in code anyway. Use a real MongoDB for anything beyond a demo.

## Automatic SKUs

Format: `{PREFIX}-{CATEGORY}-{PRODUCT}[-{VARIANT}]-{SEQUENCE}`

| Product | Category | SKU |
| --- | --- | --- |
| Stoneware Mug 350ml | Home & Living | `KC-HOL-STM-350-0001` |
| Linen Table Runner | Accessories | `KC-ACC-LTR-0002` |

- **Prefix**: your workspace SKU prefix, set in Settings.
- **Category and product codes**: 3 letters each. One word gives its first 3 letters, two words give 2 + 1, and three or more give initials.
- **Variant**: sizes such as `350ml` become a variant code.
- **Sequence**: a per-workspace counter.

SKUs are generated on the server, which guarantees they are unique per workspace. You can also lock and edit a SKU by hand.

## API overview

All routes are under `/api`. Every route except auth requires `Authorization: Bearer <token>`.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/signup`, `POST /auth/login`, `GET /auth/me` |
| Profile | `PATCH /profile`, `PUT /profile/avatar`, `PATCH /profile/preferences`, `PUT /profile/password`, `DELETE /profile` |
| Products | `GET/POST /products`, `GET /products/meta`, `GET /products/sku`, `GET/PATCH/DELETE /products/:id`, `POST /products/:id/adjust-stock`, `POST /products/bulk-delete` |
| Orders | `GET/POST /orders`, `GET/PATCH/DELETE /orders/:id` |
| Notifications | `GET /notifications`, `PATCH /notifications/read-all`, `PATCH /notifications/:id`, `DELETE /notifications/clear`, `DELETE /notifications/:id` |
| Analytics | `GET /analytics?range=30`, `GET /analytics/customers` |

Errors are returned as `{ message, details: { field: message } }`, and forms show these inline.
