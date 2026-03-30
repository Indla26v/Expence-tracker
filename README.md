# Expense Tracker (Web + Mobile, shared backend)

This repo contains:
- `web/`: Next.js App Router app (UI + API) intended for Vercel
- `mobile/`: Expo (Expo Router) app that talks to the same deployed API over HTTPS

## What the apps do (features)

### Web app (Next.js)

- **Login (single user)**: Email + password (credentials are set via env vars; no registration).
- **Dashboard**:
  - Today’s spend
  - This month’s spend
  - Monthly budget progress with **80% / 100%** warning colors
  - Recent transactions
  - Always-available **Quick add** button (FAB + top CTA)
- **Expenses**:
  - Add transaction (expense/income): amount, category, date, note
  - Edit transaction
  - Delete transaction
  - Filters: month / week / year / custom range
  - Search by note or category
  - Export current list as **CSV**
- **Analytics**:
  - Daily / Monthly / Yearly view switcher
  - Category breakdown chart
  - Time-series charts (by hour / by day / by month depending on view)
- **Settings**: Set monthly budget (upsert).

### Android app (Expo / React Native)

- **Login (single user)**: Sign in to the same backend using `POST /api/auth/mobile-login`.
- **Secure session**: Stores the JWT token in secure storage and sends it as `Authorization: Bearer <token>`.
- **Dashboard**:
  - Today’s spend
  - This month’s spend
  - Monthly budget progress with **80% / 100%** warning colors
  - Recent transactions
  - Quick add entry point
- **Expenses**:
  - Add transaction (expense/income): amount, category, date, note
  - Edit transaction (modal)
  - Delete transaction
  - Filters: month / week / year / custom range + search
- **Analytics**:
  - Daily / Monthly / Yearly selector
  - Browse by date/month/year inputs
  - Category breakdown (monthly/yearly)
  - By-hour / by-month bar-style summaries
- **Settings**: Set monthly budget + sign out.

## Web (Next.js + Prisma + Neon + NextAuth)

### 1) Configure environment variables

Copy `web/.env.example` to `web/.env` and fill:
- `DATABASE_URL`: Neon **pooled** Postgres URL
- `SHADOW_DATABASE_URL`: Neon **direct** Postgres URL (recommended for migrations)
- `NEXTAUTH_SECRET`: long random string
- `NEXTAUTH_URL`: `http://localhost:3000` for local dev
- `APP_USER_EMAIL`: your single login email
- `APP_USER_PASSWORD_HASH`: bcrypt hash of your password

Generate a bcrypt hash:

```bash
cd web
node scripts/hash-password.mjs "your-password"
```

### 2) Install + migrate + run

```bash
cd web
npm install
npm run db:migrate
npm run dev
```

Web login page: `/login`

### Mobile auth token endpoint

The mobile app uses:
- `POST /api/auth/mobile-login` → returns `{ token }`
- Send it on every request as `Authorization: Bearer <token>`

## Mobile (Expo Router + NativeWind)

### 1) Set API base URL

Edit `mobile/.env`:
- `EXPO_PUBLIC_API_BASE_URL="https://<your-vercel-deployment>.vercel.app"`

### 2) Run

```bash
cd mobile
npm install
npm run start
```

## Deployment notes (Vercel + Neon)

- Deploy **only** `web/` to Vercel.
- Set the same env vars in the Vercel dashboard (from `web/.env`).
- After first deploy, run migrations from your local machine:

```bash
cd web
DATABASE_URL="..." SHADOW_DATABASE_URL="..." npm run db:migrate
```

