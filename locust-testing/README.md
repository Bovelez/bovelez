# Load & Stress Testing (Locust)

Performance testing of the Bovelez backend API with [Locust](https://locust.io).
Two clearly differentiated schemes — **load** and **stress** — each with its own
strategy, workflow mix and dimensioning, plus a resource-constrained matrix that
caps backend CPU/memory and captures per-container metrics and graphs.

## Layout

| File | Purpose |
|------|---------|
| `common.py` | Shared config: base URL, ticker pools, register/login/me helpers. |
| `workflows.py` | The **three** human-behaviour flows (`Conversion`, `ReadOnly`, `IntensiveTxn`). |
| `load.py` | **Load** scheme — steady, sustainable traffic. |
| `stress.py` | **Stress** scheme — ramping overload + EDGAR rate-limit safeguard. |
| `run_scenarios.sh` | Runs a suite under several CPU/mem limits, samples `docker stats` per container. |
| `plot_results.py` | Turns the CSVs into per-container + Locust PNG graphs. |
| `../docker-compose.limits.yml` | Resource-limit override for the backend/DB. |
| `results/` | Generated HTML reports, CSVs and PNGs (one subdir per scenario). |

## Setup

```bash
cd locust-testing
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

The backend must be running, e.g.
`docker compose up -d database price-service backend` (API on
`http://localhost:8080`). Override the target with `BASE_URL` / `--host`.

## Running

```bash
# LOAD — steady state, 100 users for 3 minutes
.venv/bin/locust -f load.py --headless -u 100 -r 10 -t 3m \
    --host http://localhost:8080 --html results/load.html --csv results/load

# STRESS — ramping shape (0 -> 500 -> recover) drives users automatically (~4.5 min)
.venv/bin/locust -f stress.py --headless \
    --host http://localhost:8080 --html results/stress.html --csv results/stress
```

Drop `--headless` to use the web UI at http://localhost:8089.

### Resource-constrained matrix + per-container metrics

`run_scenarios.sh` restarts the backend under several CPU/memory envelopes,
samples `docker stats` for every container while Locust runs, and writes each
scenario to its own `results/<scenario>/` directory.

```bash
# from repo root, backend can be down — the script (re)starts it per scenario
cd locust-testing
./run_scenarios.sh                 # stress suite, all scenarios
SUITE=load ./run_scenarios.sh      # load suite instead
./run_scenarios.sh baseline cpu05_mem512m   # just these scenarios

# then build the graphs (PNGs land in results/)
.venv/bin/python plot_results.py --suite stress
```

Default scenarios (edit the array in `run_scenarios.sh`):

| Scenario | Backend CPUs | Backend memory | Node heap cap |
|----------|--------------|----------------|---------------|
| `baseline` | 2.0 | 2 GB | — |
| `cpu1_mem1g` | 1.0 | 1 GB | 768 MB |
| `cpu05_mem512m` | 0.5 | 512 MB | 384 MB |
| `cpu025_mem256m` | 0.25 | 256 MB | 192 MB |

Limits are applied via `docker-compose.limits.yml` (`deploy.resources.limits`).
`plot_results.py` emits, per scenario, `<scenario>_containers.png` (CPU% and
memory per container over time) and `<scenario>_locust.png` (users, RPS,
failures/s, p50/p95 latency), plus a cross-scenario `comparison.png`.

---

## Strategy & justification

### Workflows (who we simulate)

We model **three human-behaviour flows**, each an *ordered session* (not a random
mix of requests) that mirrors how people actually use the React frontend. Every
step is mapped 1:1 to the requests the frontend issues — verified against
`frontend/src` (pages, hooks, `api/*.ts`) — so the load is realistic, not
synthetic. They follow the canonical performance-testing archetypes from the
spec (conversión / solo-lectura / transaccional intenso).

- **ConversionFlow** — the app's *conversion* equivalent. View portfolio → open
  a stock's detail (company + price + filings + metrics) → add it to the
  watchlist → back to portfolio → view watchlist. The "consider then commit"
  path. It does **not** read `/transactions` (a new user has none).
- **ReadOnlyFlow** — *content browsing, the cache-impact flow*. Pure reads, no
  writes: browse dashboard / portfolio / watchlist and open several stock
  details. Stock detail is the cache-sensitive part (company/filings/metrics hit
  EDGAR on a MISS, the 24h cache on a HIT), so this flow's hit rate is the whole
  point of the "measure cache impact" requirement.
- **IntensiveTxnFlow** — *heavy transactional load*. Repeatedly open buy page →
  buy → reload portfolio → view ticker ops → sell → reload transactions. Pounds
  the transaction engine (FIFO replay grows over the run), the buy-time EDGAR
  ticker validation, and the portfolio aggregation. Only sells what it bought.

**Why these three.** They map 1:1 to real frontend flows *and* isolate the places
the system can bottleneck — DB reads, the EDGAR cache, and the write path. Each
suite then dials the *mix* of flows and the ticker *spread* to put pressure where
we want it. (Registration/login still happens once per virtual user in
`on_start`, so the auth path is exercised — it's just not its own flow.)

Each virtual user keeps its own session state (token, watchlist, holdings) so
later steps act on data it created — IntensiveTxn only sells what it bought; the
API enforces watchlist ownership on `/compare`.

### Endpoints used (frontend parity)

The persistent **AppLayout shell** wraps every `/app` page and on each visit
issues `GET /prices` (the ticker bar + the source for client-side search
suggestions), `GET /prices/last-run`, and `GET /auth/me`. The flows replicate
this "shell cost" via a `_shell()` helper, which is why **`GET /prices` is the
single most-hit endpoint** — exactly as in the UI.

All users register once in `on_start` (`POST /auth/register`).

| Flow | Endpoints (beyond the shell `/prices`, `/prices/last-run`, `/auth/me`) |
|------|------------------------------------------------------------------------|
| Conversion | `/portfolio`, stock detail (`/edgar/companies/{t}`, `/prices/{t}`, `/edgar/{t}/filings`, `/edgar/{t}/metrics`), `/watchlist` (POST + GET) |
| ReadOnly | `/portfolio`, `/transactions`, `/watchlist`, stock detail (×N) |
| IntensiveTxn | `/prices/{t}`, `/edgar/companies/{t}`, `/transactions/buy`, `/transactions/{t}`, `/transactions/sell`, `/portfolio`, `/transactions` |

**Two corrections from reading the frontend carefully:**

- **`GET /prices` vs `GET /prices/{ticker}`.** `/prices` (the whole list) is hit
  on *every* authenticated page via the ticker bar, and also powers the search
  boxes (filtered client-side). `/prices/{ticker}` (single lookup) is hit only on
  the StockDetail / Buy / Sell pages. So `/prices` is the hot path, not
  `/prices/{ticker}`.
- **`GET /edgar/search` is excluded — it's unreachable from the UI.** Both search
  boxes (header and watchlist "add company") filter the already-loaded `/prices`
  list **client-side** (`useGetTickerSuggestions`, `useWatchlistSearch` — pure
  functions, no network). The functions that *would* call `/edgar/search`
  (`useEdgarSearch`, `searchEdgar`) exist but are **dead code** — nothing imports
  them, and there is no `/app/search` route. Load-testing it would be synthetic
  traffic no real user generates, so we leave it out. (The backend search-cache
  fix below still applies the moment that page gets wired up.)

**Excluded by the spec.** `POST /prices/update` triggers the Yahoo Finance batch;
the spec is explicit that *"el proceso batch de precios corre una única vez y no
genera carga continua sobre Yahoo Finance"*. Calling it repeatedly would hammer
Yahoo, so it is out of scope for continuous load.

### Load vs Stress (how they differ)

| Dimension | **Load** | **Stress** |
|-----------|----------|------------|
| Goal | Confirm health under expected traffic | Find the breaking point & confirm graceful failure |
| Concurrency | Constant 100 users | Ramp 0 → 125 → 375 → **500** → recover, via `LoadTestShape` |
| Mix | ReadOnly 50% / Conversion 30% / Intensive 20% | **ReadOnly 45%** / **Intensive 36%** / Conversion 18% |
| Ticker spread | `HOT_TICKERS` (8) → high cache hit rate | `ALL_TICKERS` (68) → more cache misses |
| Think time | `between(1,3)`s (realistic) | `between(0,0.2)`s (hammer) |
| EDGAR guard | none needed (cache hits dominate) | shared token-bucket, `EDGAR_UPSTREAM_RPS=8` |

### EDGAR 10 req/s safeguard (required by the spec)

The stress scheme stays under EDGAR's limit **by design**, two ways:

The cache-missable EDGAR calls under load are the **stock-detail reads**
(`/edgar/companies/{t}`, `/edgar/{t}/filings`, `/edgar/{t}/metrics`) plus
`/watchlist/compare`. Two mechanisms keep us under 10 req/s:

1. **The 24h cache** (`EdgarService`) — only the *first* request per key reaches
   `data.sec.gov`. With ~68 distinct tickers, a cold cache produces at most a few
   dozen upstream calls for the whole run, then ~0 — far below 10 req/s sustained.
2. **An explicit shared token-bucket limiter** (`EDGAR_UPSTREAM_RPS`, default 8)
   caps the *aggregate* rate of those cache-missable EDGAR calls across **all**
   simulated users. When the bucket is empty the flow falls back to an
   already-cached hot ticker, so the request is served from cache and never
   reaches the SEC. This bounds the worst case even on a cold cache.

> **Backend improvement included.** `EdgarService.searchCompanies` originally had
> **no cache** (unlike metrics/filings), making `/edgar/search` the one endpoint
> that would 502 under load. We extended the same 24h cache to it (keyed by the
> normalized query). Note: `/edgar/search` isn't reachable from the current UI
> (see above), so the workflows don't exercise it — but the fix is in place for
> when the search page is wired up, and is verifiable directly (e.g. two `curl`s
> for the same query: first slow, second instant).

The Yahoo / price-update batch is **intentionally not** load-tested
continuously: per the spec it runs once per invocation and must not generate
sustained load on Yahoo, so `POST /prices/update` is out of scope for these
workflows (the `/prices` GET reads are in-scope and DB-backed).

### Dimensioning rationale

- **100 users / load**: a plausible concurrent-user count for an app of this
  scope; large enough for stable percentiles, small enough to represent steady
  state.
- **500 users peak / stress**: 5× steady state — enough to push a single backend
  container past capacity and expose the knee of the latency curve.
- **Stage durations**: 60s ramp to warm caches, 60s approach, hold at 500 for
  120s so the overload is *sustained* (not a transient spike), then a 30s
  back-off to verify recovery.
- **Resource matrix**: halving CPU and memory each step (2g→1g→512m→256m) finds
  the envelope where the backend can no longer keep latency/errors acceptable —
  the input to a capacity / right-sizing decision.

### How a "user" behaves (and why it loops)

A simulated user **registers once** (in `on_start`) and then **repeats its
flow** for the whole test — e.g. IntensiveTxn loops buy → reload → sell →
review → start over. It is *not* registering/logging in repeatedly; it's one
persistent session generating sustained traffic.

This is the standard load-test model, and it's deliberate: if every user did a
single pass and left, Locust would spend most of its time on register churn
instead of measuring the endpoints under test, and you could never hold a steady
concurrency. The looping session is what lets us pin "100 concurrent users" or
"ramp to 500" as a stable, meaningful number.

A side effect worth knowing: because IntensiveTxn keeps buying across loops, the
DB and the FIFO position replay grow during a run. That's realistic (portfolios
accumulate) and actually *useful* for stress — heavier portfolios over time are
a more demanding read. If you want stricter steady-state for the load suite, you
can reset per-user state each pass; we keep the looping model by default.

> **Note on the load generator.** A single Locust process runs on one CPU core
> (gevent is cooperative, not parallel). 500 users is comfortable for one process
> on a normal machine; if you ever see RPS flat-line while Locust's own CPU pegs,
> that's the generator, not the API — add `--processes -1` (one worker per core).

---

## Reading the results

After a run, look at:

- `results/<scenario>/<suite>.html` — Locust's own report (per-endpoint tables).
- `results/<scenario>_containers.png` — CPU% and memory per container. Watch the
  backend approach its memory cap and CPU saturate as users ramp.
- `results/<scenario>_locust.png` — users vs RPS vs failures/s vs p50/p95. The
  point where p95 turns sharply upward (and failures/s leaves zero) is the knee.
- `results/comparison.png` — peak p95, peak RPS and peak backend memory across
  scenarios; shows how tighter limits move the knee earlier.

### What to expect (hypotheses to confirm with your data)

- **DB-backed reads (the `/prices` shell, portfolio) degrade gracefully**:
  latency rises under overload but errors stay ~0% and the API recovers on
  back-off. `/prices` is the highest-volume endpoint, so watch it first.
- **Cached EDGAR paths (stock-detail metrics/filings, compare) survive** because
  repeat reads hit the 24h cache and rarely reach `data.sec.gov`. The ReadOnly
  flow with HOT tickers (load) vs ALL tickers (stress) is the direct cache-impact
  comparison — same flow, different hit rate.
- **The write path (IntensiveTxn) is the likely latency driver** under stress:
  each buy/sell runs the FIFO replay over a growing transaction set.
- **Tighter resource limits shift the knee earlier**: at 256 MB the Node heap cap
  is the first thing to bite; CPU saturation dominates at 0.25 CPU.
- **Watch the load generator too**: if RPS flat-lines while Locust's own CPU
  pegs, that's the generator saturating, not the API (add `--processes -1`).

> Fill the tables below with your measured numbers (from the Locust HTML and the
> generated PNGs) once you've run `run_scenarios.sh`.

| Scenario | Peak RPS | Failures % | p50 (ms) | p95 (ms) | Peak backend mem (MB) | Notes |
|----------|----------|------------|----------|----------|-----------------------|-------|
| baseline | | | | | | |
| cpu1_mem1g | | | | | | |
| cpu05_mem512m | | | | | | |
| cpu025_mem256m | | | | | | |
