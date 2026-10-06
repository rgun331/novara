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
- **Privacy and Terms** pages at `/privacy` and `/terms`.

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
  server/   Express + Mongoose API (auth, profile, products, orders, notifications, analytics)
```

## Getting started

Requirements: Node 22.13 or newer.

```bash
npm install      # installs the root, server and client dependencies
npm run dev      # API on http://localhost:5000, app on http://localhost:5173
```

You can also run them separately: `npm run server` and `npm run client` (or `npm run dev` inside each folder).

### Database

The API uses MongoDB through Mongoose. Pick one:

- **Your own MongoDB or Atlas:** copy `server/.env.example` to `server/.env` and set `MONGODB_URI`.
- **Nothing installed?** Leave `MONGODB_URI` unset. In development, the server starts a small built-in MongoDB-compatible database inside the API process and saves data to `server/.data/` (gitignored), so accounts survive restarts. Delete that folder to start fresh.

The built-in database lives in `server/src/embedded-db/` and is a dev dependency only. It is never loaded when `MONGODB_URI` is set, and in production the server requires `MONGODB_URI`.

### Demo account

In development the API creates a ready-made workspace on startup:

| Email | Password |
| --- | --- |
| `demo@novara.app` | `demo1234` |

It comes with 8 products, about 60 days of orders, customers and notifications, so the analytics have real data to show. The login page has an **Open demo** button. New sign-ups always start with an empty workspace. Turn the demo off with `SEED_DEMO=false`. In production it is off unless you set `SEED_DEMO=true`.

### Production (single port)

```bash
npm start        # builds the client and serves it from Express (needs MONGODB_URI)
```

### Environment (`server/.env`)

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `5000` | API port |
| `MONGODB_URI` | not set | Local MongoDB or Atlas. If unset in development, the built-in database is used |
| `JWT_SECRET` | dev value | **Required in production**: a random string of 32+ characters (the server refuses to start otherwise) |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `CLIENT_ORIGIN` | `*` | CORS origins, comma-separated |
| `SERVE_CLIENT` | `false` (`true` in production) | Serve `client/dist` from Express |
| `SEED_DEMO` | `true` in dev, `false` in production | Create the demo account on startup |
| `EMBEDDED_DB_PORT` | `27018` | Port for the built-in dev database |

For the client, `VITE_API_PROXY` changes where Vite proxies `/api` (default `http://127.0.0.1:5000`).

### Security

- Passwords are hashed with bcrypt. Login takes the same time whether or not the email exists, and login/sign-up are rate limited.
- Session tokens are HS256 JWTs pinned to that algorithm. Changing your password signs out every other session (token versioning), while the current device receives a fresh token.
- Every query is scoped to the logged-in owner, so one workspace can never read or change another's products, orders or notifications.
- Request values are type-checked, so objects or arrays sent in place of strings get a 400, never a crash or an injected query operator.
- When Express serves the built app, it sends a strict Content Security Policy (everything is self-hosted, no third-party requests) along with Helmet's other security headers.
- The shared demo account's email and password are locked, and the account cannot be deleted.

### Resilience

- The API starts listening right away. Until the database connects (or while it reconnects), API calls return `503` with a clear message instead of hanging.
- The login and sign-up pages poll `/api/health` and show a "server is not responding" banner that clears on its own.
- The client turns gateway errors (502/503/504), HTML error pages and network failures into one friendly message, so raw proxy errors never reach the user.

> **About the built-in database:** it is `@rckflr/easydb-server` (a MongoDB wire-protocol server) with a few compatibility patches applied on install, storing data with Node's built-in `node:sqlite` through a tiny `better-sqlite3` shim. It does not enforce unique indexes, but Novara checks email and SKU uniqueness in code anyway. Use a real MongoDB for anything beyond development.

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
