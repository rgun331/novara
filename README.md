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
| Database | MongoDB Atlas (any MongoDB 6+ works) |

## Project layout

```
novara/
  client/   React app (Vite). The dev server proxies /api to the API.
  server/   Express + Mongoose API (auth, profile, products, orders, notifications, analytics)
```

## Getting started

Requirements: Node 20.19 or newer and a MongoDB Atlas cluster (the free M0 tier is fine).

### 1. Set up MongoDB Atlas

1. Create a cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Database Access**: add a database user with a strong password and the *Read and write to any database* role (or scope it to the `novara` database).
3. **Network Access**: add the IP addresses that will connect. That means your own IP for local development and your host's outbound IPs in production. `0.0.0.0/0` works but lets anyone with the credentials try to connect, so use it only if your host has no fixed IPs.
4. **Connect > Drivers**: copy the `mongodb+srv://` connection string and add the database name before the `?`:

   ```
   mongodb+srv://novara_app:<password>@cluster0.xxxxx.mongodb.net/novara?retryWrites=true&w=majority
   ```

   If the password contains special characters (`@ : / ? # [ ] %`), URL-encode them.

Collections and indexes are created automatically the first time the API starts.

### 2. Configure the server

```bash
cp server/.env.example server/.env
```

Then set the two required values in `server/.env`:

```bash
MONGO_URI=mongodb+srv://...           # from step 1
JWT_SECRET=...                        # 32+ random characters, generate with:
# node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

The server will not start without them. It prints a clear message saying what is missing.

### 3. Run it

```bash
npm install      # installs the root, server and client dependencies
npm run dev      # API on http://localhost:5000, app on http://localhost:5173
```

The Vite dev server proxies `/api` to the API, so no CORS setup is needed in development.

**Optional sample data:** `npm run seed:demo` creates a `demo@novara.app` workspace with products, about 60 days of orders and notifications, and prints its password (set `DEMO_PASSWORD` to choose one). It refuses to run when `NODE_ENV=production`.

## Deploying

Novara deploys as **one Node service**: Express serves both the API and the built React app on the same origin.

| Setting | Value |
| --- | --- |
| Build command | `npm install && npm run build` |
| Start command | `npm start` |
| Environment | `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET` |
| Health check | `GET /api/health` (200 when the database is connected, 503 otherwise) |

This works as-is on Render, Railway, Fly.io, Heroku or a VPS behind Nginx. The platform's `PORT` is picked up automatically. After deploying, add the host's outbound IPs to Atlas Network Access.

### Environment variables (`server/.env`)

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `MONGO_URI` | yes | | Atlas connection string including the database name |
| `JWT_SECRET` | yes | | 32+ random characters. Changing it signs everyone out |
| `NODE_ENV` | | `development` | Set `production` in production |
| `PORT` | | `5000` | |
| `JWT_EXPIRES_IN` | | `7d` | Login lifetime |
| `TRUST_PROXY` | | `1` in production, else `false` | Number of proxies in front of the app, used to read the real client IP for rate limits. Set `false` if Node is exposed directly |
| `CLIENT_ORIGIN` | | empty | Only if the client is hosted on another domain: comma-separated exact origins allowed by CORS (with credentials) |
| `COOKIE_SECURE` | | `true` in production | Set `false` only to try a production build over plain http |
| `COOKIE_SAMESITE` | | `strict` | Use `none` only if the client and API are on unrelated domains (see below) |
| `SERVE_CLIENT` | | auto | Serve `client/dist` from Express. Automatically on when the client has been built |

**Hosting the client separately** (for example on Vercel or Netlify): build it with `VITE_API_URL=https://api.yourdomain.com npm run build --prefix client`, then set `CLIENT_ORIGIN=https://app.yourdomain.com` and `SERVE_CLIENT=false` on the API. Keep both on subdomains of the same domain (`app.` and `api.`) so the strict session cookie still works. Completely different domains need `COOKIE_SAMESITE=none`, and some browsers (Safari) block those cookies, so the single deployment is recommended. In development, `VITE_API_PROXY` changes where Vite proxies `/api`.

## Security

- **Secrets come only from the environment.** There are no default credentials or fallback JWT secret, and `server/.env` is gitignored.
- **Passwords** are hashed with bcrypt (cost 11) and capped at 128 characters. Login takes the same time whether or not the email exists, so accounts cannot be discovered by timing.
- **Rate limits**: 20 sign-ups per IP per hour, 60 login attempts per IP and 10 failed attempts per account per 15 minutes, plus a general API limit per IP.
- **Sessions** live in an `httpOnly`, `Secure`, `SameSite=Strict` cookie (`__Host-` prefixed in production), so page scripts can never read the token. The token is an HS256 JWT pinned to that algorithm. "Keep me logged in" off gives a cookie that ends when the browser closes.
- **CSRF**: besides SameSite, every state-changing request must carry an `X-Requested-With` header, which cross-site pages cannot add without passing CORS.
- **Revocation**: changing your password signs out every other device, and Settings > Security has **Sign out everywhere**. Changing your email or password, or deleting the account, requires the current password.
- **Tenant isolation**: every query is scoped to the logged-in owner, so one workspace can never read or change another's data.
- **Input handling**: request values are type-checked and bounded (lengths, prices, quantities, list sizes). Objects sent in place of strings get a 400 instead of becoming query operators, and search text is regex-escaped.
- **Headers**: Helmet with a strict Content Security Policy (everything is self-hosted), HSTS, frame protection and no `X-Powered-By`. CORS is off unless `CLIENT_ORIGIN` is set.
- **Errors**: unexpected server errors are logged but return a generic message in production, so stack traces and database details never reach the browser.
- **CSV exports** neutralise spreadsheet formulas in user-entered text (CSV injection).
- **Images** (product photos, avatars) are served from authenticated, owner-scoped URLs with the right content type. Only PNG, JPG, WebP and GIF are accepted (no SVG).
- **Data hygiene**: notifications are removed automatically after 90 days (TTL index). Deleting an account removes all of its products, orders and notifications.

## Reliability

- The server connects to MongoDB before it starts listening, retrying a few times so a slow cold start doesn't fail the deploy. If Atlas becomes unreachable later, API calls return `503` with a clear message until the driver reconnects.
- `SIGTERM`/`SIGINT` trigger a graceful shutdown: in-flight requests finish, then the database pool closes.
- Hashed build assets are cached for a year. `index.html` is always revalidated, so deploys show up immediately.
- The login and sign-up pages show a "server is not responding" banner while the API or database is unavailable.

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

All routes are under `/api`. Authentication uses the session cookie set by sign-up or login. State-changing requests must send `X-Requested-With: XMLHttpRequest`.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/signup`, `POST /auth/login`, `GET /auth/session`, `GET /auth/me`, `POST /auth/logout`, `POST /auth/logout-all` |
| Profile | `PATCH /profile`, `GET/PUT /profile/avatar`, `PATCH /profile/preferences`, `PUT /profile/password`, `DELETE /profile` |
| Products | `GET/POST /products`, `GET /products/meta`, `GET /products/sku`, `GET/PATCH/DELETE /products/:id`, `GET /products/:id/image`, `POST /products/:id/adjust-stock`, `POST /products/bulk-delete` |
| Orders | `GET/POST /orders`, `GET/PATCH/DELETE /orders/:id` |
| Notifications | `GET /notifications`, `PATCH /notifications/read-all`, `PATCH /notifications/:id`, `DELETE /notifications/clear`, `DELETE /notifications/:id` |
| Analytics | `GET /analytics?range=30`, `GET /analytics/customers` |

Errors are returned as `{ message, details: { field: message } }`, and forms show these inline.
