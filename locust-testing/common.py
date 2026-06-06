"""Shared helpers and data pools for the Locust suites.

Every suite (load / stress) and every workflow imports from here so the
*behaviour* stays identical across schemes; only the **dimensioning** (users,
spawn rate, run time, ticker spread) differs — see load.py and stress.py.

"""

import os
import random
import uuid

# Backend base URL. Override with BASE_URL when the API is not on localhost
BASE_URL = os.getenv("BASE_URL", "http://localhost:8080")

# Tickers seeded into StockPrice on backend startup
# "HOT" = small set => high EDGAR cache hit rate.
HOT_TICKERS = [
    "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "JPM",
]

# A wider pool used by the stress suite to deliberately spread requests across
# many *distinct* tickers. Each new ticker is a cache MISS on its first hit, so
# this pool is what actually exercises the EDGAR upstream + 10 req/s limit.
COLD_TICKERS = [
    "AVGO", "MCD", "MU", "LLY", "AMD", "XOM", "JNJ", "INTC", "V", "WMT",
    "CSCO", "COST", "MA", "CAT", "ABBV", "LRCX", "NFLX", "CVX", "UNH", "BAC",
    "AMAT", "PG", "ORCL", "GE", "KO", "PLTR", "HD", "GS", "PM", "MRK",
    "ADBE", "CRM", "TXN", "QCOM", "HON", "IBM", "BA", "GILD", "BKNG", "NOW",
    "ISRG", "VRTX", "REGN", "ADI", "PANW", "SBUX", "PFE", "T", "VZ", "DIS",
    "NKE", "LIN", "DHR", "TMO", "UNP", "RTX", "LOW", "SPGI", "ELV", "BLK",
]

ALL_TICKERS = HOT_TICKERS + COLD_TICKERS


def register_and_login(client):
    """Register a fresh account and return its JWT (or None on failure).

    Mirrors the frontend Register flow: POST /auth/register returns a token and
    the app navigates straight into /app (it does not bounce through /login).
    Each simulated user gets a unique account so auth state is isolated.
    """
    email = f"loadtest_{uuid.uuid4().hex}@example.com"
    password = "Password123!"
    payload = {"name": "Load Test", "email": email, "password": password}

    with client.post(
        "/auth/register", json=payload, name="/auth/register", catch_response=True
    ) as resp:
        if resp.status_code in (200, 201):
            token = resp.json().get("token")
            if token:
                resp.success()
                return token
        resp.failure(f"register failed: {resp.status_code} {resp.text[:200]}")
    return None


def fetch_me(client, token):
    """GET /auth/me — the AppLayout shell calls this on every authed page."""
    client.get("/auth/me", headers=auth_header(token), name="/auth/me")


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def pick_quarters():
    # QueryMetricsDto only accepts 4..8 (backend/edgar/dto/query-metrics.dto.ts).
    return random.choice([4, 5, 6, 7, 8])
