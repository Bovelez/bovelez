# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

**Bovelez** is a stock portfolio tracker. Users register/login, buy/sell shares (validated against EDGAR), and view their portfolio with live prices. The monorepo has four components:

- `backend/` — NestJS REST API (TypeScript)
- `frontend/` — React + Vite SPA (TypeScript)
- `price-service/` — Python FastAPI microservice that fetches prices from Yahoo Finance
- `docker-compose.yml` — orchestrates all four services plus a Postgres DB

## Running the stack

```bash
# Full dev stack (recommended)
docker compose up --build
# Frontend: http://localhost:5173  |  Backend API: http://localhost:8080
```

To override the API URL for the frontend:
```bash
VITE_API_URL=http://localhost:8080 docker compose up --build frontend
```

## Backend commands (`cd backend`)

```bash
npm run dev              # apply migrations + start with watch
npm run test             # unit tests (jest, *.spec.ts)
npm run test:int         # integration tests against a Docker Postgres (*.int-spec.ts)
npm run lint             # eslint --fix
npm run db:migrate       # prisma migrate dev (creates new migration)
npm run db:generate      # regenerate prisma client
```

Run a single unit test file:
```bash
npx jest path/to/file.spec.ts
```

Integration tests require Docker (spins up `integration-test-db` via docker compose profile `test`).

## Frontend commands (`cd frontend`)

```bash
npm run dev      # Vite dev server on :5173
npm run build    # tsc + vite build
npx cypress run  # E2E tests (auth flows only currently)
```

## Backend architecture

All modules live under `src/modules/`. Each module follows a consistent layering:

```
controller/   ← HTTP layer, validates inputs, calls service
service/      ← business logic
repository/   ← Prisma queries, always behind an interface
dto/          ← response shapes
input/        ← request body classes (class-validator decorators)
```

**Global JWT guard** is registered on `AppModule` as `APP_GUARD`; all routes are protected by default. Use the `@Public()` decorator to opt out.

**Modules:**
- `auth` — register/login, issues JWT, hashes with argon2id
- `users` — user management (delete account)
- `transactions` — buy/sell logic; buy validates the ticker against EDGAR and looks up the current price from `prices`; positions are computed by replaying all transactions (FIFO average cost)
- `portfolio` — aggregates open positions (from `transactions`) with current prices (from `prices`); no own DB table
- `prices` — batch price fetching via HTTP to `price-service`; stores results in `StockPrice`/`PriceBatchRun`; seeds all S&P 500 tickers on startup
- `edgar` — EDGAR company search/sync; ticker validation uses the local `EdgarCompany` table populated by syncing from the SEC API

Repositories are injected via string tokens (e.g. `@Inject('TransactionsRepository')`), enabling easy mocking in unit tests.

## Frontend architecture

**API layer** (`src/api/`): thin axios wrappers per domain. `apiClient.ts` sets `VITE_API_URL` as base URL, attaches JWT from `localStorage`, and redirects to `/login` on 401.

**Data fetching** (`src/hooks/`): TanStack Query hooks per domain (`usePortfolio`, `useAuth`, `useStockPrices`, etc.). Query keys are co-located in `queryKeys.ts` per module.

**Routing** (`src/app/routes.tsx`): React Router v7. Public routes (`/`, `/login`, `/register`) are wrapped in `AlreadyLoggedLayout` (redirects to app if already authed). Protected routes (`/app/*`) are wrapped in `AuthLayout`.

**Pages:** `Dashboard` and `Portfolio`. `Dashboard` shows portfolio summary rows; `Portfolio` shows active positions with a `TransactionPanel` for buy/sell.

**Auth storage:** JWT is persisted in `localStorage` via `src/storage/auth/auth.storage.ts`.

## Price service (`price-service/`)

Python FastAPI service. Exposes `POST /prices/fetch` (takes a list of tickers, returns prices + errors). Uses `yfinance` as primary source with a direct Yahoo Finance v8 HTTP call as fallback (needed in Docker/datacenter environments where yfinance is rate-limited).

## Database schema (Prisma)

Key models: `User`, `Transaction` (BUY/SELL, links to user), `StockPrice` (ticker → current price), `PriceBatchRun` (batch metadata), `EdgarCompany` (CIK + ticker + name cache).

Portfolio positions have **no own table** — they are computed on-the-fly by replaying `Transaction` records.

## Environment variables

Backend reads from `backend/.env` (not committed). Required:
- `DATABASE_URL` — Postgres connection string
- `JWT_SECRET` — JWT signing secret
- `PRICE_SERVICE_URL` — URL of the price-service (default in Docker: `http://price-service:8000`)

For integration tests, create `backend/.env.test`:
- `DATABASE_URL` — points to the test Postgres (default: `postgresql://prisma:prisma@localhost:5433/tests`)

## Commit conventions

This repo uses Conventional Commits for automated semantic versioning via `semantic-release`:
- `fix:` → patch release
- `feat:` → minor release
- `feat!:` / `BREAKING CHANGE:` → major release
