"""LOAD test — steady-state, sustainable traffic.

Goal
----
Characterise the system under the load we expect in *normal* operation and
confirm it stays healthy (low latency, ~0% errors) for a sustained period.

Strategy
--------
Mix the four human-behaviour flows the way a real user base splits: most people
browse (ReadOnly), a healthy share are converting (Conversion) and a smaller 
slice are heavy traders (IntensiveTxn).

    ReadOnlyUser      weight 5   50%   browsing + stock details (cache-friendly)
    ConversionUser    weight 3   30%   look -> inspect -> add to watchlist
    IntensiveTxnUser  weight 2   20%   write-heavy buy/sell

All flows draw from HOT_TICKERS only, so after a brief warm-up almost every
EDGAR read (the stock-detail company/filings/metrics calls) is a 24h-cache HIT
and never reaches data.sec.gov. That is the intended steady state and keeps us
trivially under EDGAR's 10 req/s without any explicit throttling — no
edgar_guard needed here.

Realistic think-time (wait_time) between actions and a constant user count mean
we measure latency at a fixed, representative concurrency rather than hunting
for the breaking point (that's the stress suite's job).

Dimensioning (override with -u / -r / -t on the CLI)
----------------------------------------------------
    users        100       a plausible concurrent-user count for this app
    spawn-rate    10 / s    reach target in ~10s
    run-time      3m        long enough for percentiles to stabilise

Run:
    locust -f load.py --headless -u 100 -r 10 -t 3m \
        --host http://localhost:8080 \
        --html results/load.html --csv results/load
"""

from locust import between

from common import HOT_TICKERS
from workflows import build_users

# Load uses the small/hot pool (high cache hit rate) and no EDGAR guard:
# cache hits dominate, so we stay trivially under EDGAR's 10 req/s.
_Conversion, _ReadOnly, _Intensive = build_users(ticker_pool=HOT_TICKERS)


class LoadReadOnlyUser(_ReadOnly):
    weight = 5  # browsing is the bulk of real traffic
    wait_time = between(1, 3)  # users think between actions


class LoadConversionUser(_Conversion):
    weight = 3
    wait_time = between(1, 3)


class LoadIntensiveTxnUser(_Intensive):
    weight = 2
    wait_time = between(1, 3)
