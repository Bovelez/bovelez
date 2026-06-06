"""STRESS test — push past capacity to find the breaking point.

Goal
----
Deliberately overload the API to discover where latency degrades and errors
appear, and to verify the system fails *gracefully* (no crash; errors logged
and skipped) rather than catastrophically.

How stress differs from load
----------------------------
- Higher concurrency driven by a ramping LoadTestShape (stages) that climbs
  well beyond the steady-state level, holds at overload, then backs off — so we
  read the *knee* of the latency curve instead of a single point.
- The mix is tilted toward the two expensive flows — ReadOnly (which opens lots
  of stock details = cache-missable EDGAR reads) and IntensiveTxn (the write
  path) — and every flow draws from ALL_TICKERS, maximising EDGAR cache MISSES,
  the path that actually pushes traffic toward data.sec.gov.
- Near-zero wait_time: users hammer the API as fast as it responds.

    ReadOnlyUser      weight 5   ~45%   EDGAR-heavy (stock details) — cache stress
    IntensiveTxnUser  weight 4   ~36%   write path under pressure
    ConversionUser    weight 2   ~18%   mixed read+write

EDGAR 10 req/s safeguard
---------------------------------------------
The price batch (Yahoo) runs once per invocation and is explicitly out of
scope; the continuous upstream pressure here is EDGAR. Two mechanisms keep us
under 10 req/s *by design*:

  1. The 24h in-memory cache (EdgarService) means only the FIRST request per
     key reaches data.sec.gov. With ~68 distinct tickers a cold cache produces
     at most a few dozen upstream calls total, then ~0 for the rest of the run.
  2. As an explicit, auditable guard we additionally cap the *aggregate* rate
     of cache-missable EDGAR endpoints across all simulated users via a shared
     token-bucket limiter (EDGAR_UPSTREAM_RPS, default 8 to leave headroom under
     10). When the bucket is empty the flow falls back to a guaranteed-cached
     HOT ticker, so the request is served from cache and never reaches the SEC.

Dimensioning (the shape drives -u/-r automatically; -t is bounded by the shape)
-------------------------------------------------------------------------------
    stage 1   ramp   0 -> 125 users over  60s   (warm caches)
    stage 2   ramp 125 -> 375 users over  60s   (approach capacity)
    stage 3   hold      500 users for     120s  (overload / find the knee)
    stage 4   ramp 500 ->  50 users over   30s   (recovery check)
    total ~4.5 min

Run:
    locust -f stress.py --headless \
        --host http://localhost:8080 \
        --html results/stress.html --csv results/stress
"""

import os
import threading
import time

from locust import LoadTestShape, between

from common import ALL_TICKERS
from workflows import build_users


# --- Shared token-bucket limiter for EDGAR upstream-capable endpoints --------
EDGAR_UPSTREAM_RPS = float(os.getenv("EDGAR_UPSTREAM_RPS", "8"))


class _TokenBucket:
    """Process-wide rate limiter. acquire() is non-blocking."""

    def __init__(self, rate):
        self.rate = rate
        self.tokens = rate
        self.updated = time.monotonic()
        self.lock = threading.Lock()

    def acquire(self):
        with self.lock:
            now = time.monotonic()
            self.tokens = min(self.rate, self.tokens + (now - self.updated) * self.rate)
            self.updated = now
            if self.tokens >= 1:
                self.tokens -= 1
                return True
            return False


edgar_bucket = _TokenBucket(EDGAR_UPSTREAM_RPS)

# Stress draws from the wide ticker pool (more cache misses) and shares the
# EDGAR token-bucket guard across every flow, bounding aggregate upstream rate.
STRESS_TICKERS = ALL_TICKERS

_Conversion, _ReadOnly, _Intensive = build_users(
    ticker_pool=STRESS_TICKERS, edgar_guard=edgar_bucket
)


class StressReadOnlyUser(_ReadOnly):
    weight = 5  # opens many stock details -> EDGAR cache stress target
    wait_time = between(0, 0.2)


class StressIntensiveTxnUser(_Intensive):
    weight = 4  # write path under pressure
    wait_time = between(0, 0.2)


class StressConversionUser(_Conversion):
    weight = 2
    wait_time = between(0, 0.2)


class StressShape(LoadTestShape):
    """Ramp 0 -> 500, hold at 500 (find the knee), then back off (recovery)."""

    stages = [
        {"duration": 60, "users": 125, "spawn_rate": 10},   # warm caches
        {"duration": 120, "users": 375, "spawn_rate": 10},  # approach capacity
        {"duration": 240, "users": 500, "spawn_rate": 25},  # overload / the knee
        {"duration": 270, "users": 50, "spawn_rate": 25},   # recovery check
    ]

    def tick(self):
        run_time = self.get_run_time()
        for stage in self.stages:
            if run_time < stage["duration"]:
                return stage["users"], stage["spawn_rate"]
        return None
