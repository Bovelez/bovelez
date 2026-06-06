"""Reusable Locust user behaviours (workflows) for the Bovelez API.

1. ConversionFlow —
   View portfolio -> open a stock's detail (company + price + filings + metrics)
   -> add it to the watchlist -> back to portfolio -> view watchlist.

2. ReadOnlyFlow — content browsing, ideal for measuring cache impact.
   Pure reads, no writes: browse dashboard / portfolio / watchlist (each pulls
   the shared price list) and open several stock details. Stock detail is the
   cache-sensitive part: company/filings/metrics hit EDGAR on a MISS and the
   24h cache on a HIT.

3. IntensiveTxnFlow — heavy transactional load.
   Repeatedly buy and sell and reload portfolio + transactions. Write-heavy:
   pounds the transaction engine (FIFO replay grows over time), the buy-time
   EDGAR ticker validation, and the portfolio aggregation. Only sells tickers it
   actually bought.

State per virtual user
----------------------
Each flow keeps its own session state (token, watchlist, holdings) so later
steps act on data it created — IntensiveTxn only sells what it bought; the API
enforces watchlist ownership on /compare.

``edgar_guard`` is injected by the stress suite as a token-bucket bounding the
aggregate rate of EDGAR-upstream-capable calls (the stock-detail company /
filings / metrics reads, and /watchlist/compare) under 10 req/s. In the load
suite it is a no-op that always allows.
"""

import random

from locust import HttpUser, SequentialTaskSet, task

from common import (
    HOT_TICKERS,
    auth_header,
    fetch_me,
    register_and_login,
)


class _AlwaysAllow:
    """Default EDGAR guard: a no-op limiter (used by the load suite)."""

    def acquire(self):
        return True


# ---------------------------------------------------------------------------
# Base flow: shared session bootstrap, AppLayout shell, EDGAR guard helper.
# ---------------------------------------------------------------------------
class _Flow(SequentialTaskSet):
    # Suites override these. ticker_pool decides the EDGAR cache hit rate;
    # edgar_guard bounds the aggregate EDGAR upstream rate.
    ticker_pool = HOT_TICKERS
    edgar_guard = _AlwaysAllow()

    def on_start(self):
        self.token = register_and_login(self.client)
        self.watchlist = []   # tickers this user added
        self.holdings = []    # tickers this user bought

    def _h(self):
        return auth_header(self.token)

    # The cost the AppLayout shell adds to every authenticated page visit:
    # the ticker bar (/prices), the last-run banner, and the /auth/me check.
    def _shell(self):
        if not self.token:
            return
        self.client.get("/prices", name="/prices")
        self.client.get("/prices/last-run", name="/prices/last-run")
        fetch_me(self.client, self.token)

    # Open a stock's detail page
    def _open_stock_detail(self, ticker):
        guarded = self.edgar_guard.acquire()
        t = ticker if guarded else HOT_TICKERS[0]  # fall back to a cached ticker
        self.client.get(f"/edgar/companies/{t}", name="/edgar/companies/[ticker]")
        self.client.get(f"/prices/{t}", name="/prices/[ticker]")
        self.client.get(f"/edgar/companies/{t}/filings", name="/edgar/[ticker]/filings")
        self.client.get(
            f"/edgar/companies/{t}/metrics",
            params={"quarters": 8},  # the UI requests 8 quarters
            name="/edgar/[ticker]/metrics",
        )
        return t

# ---------------------------------------------------------------------------
# 1. Conversion — portfolio -> stock detail -> add to watchlist -> back -> watchlist.
# ---------------------------------------------------------------------------
class ConversionFlow(_Flow):
    """Consideration then commit: look, inspect a stock, add it, review."""

    @task
    def view_portfolio(self):
        if not self.token:
            return
        self._shell()
        self.client.get("/portfolio", headers=self._h(), name="/portfolio")

    @task
    def inspect_stock(self):
        # Open the detail page of a company the user is considering.
        ticker = random.choice(self.ticker_pool)
        self._considered = self._open_stock_detail(ticker)

    @task
    def add_to_watchlist(self):
        if not self.token:
            return
        ticker = getattr(self, "_considered", None) or random.choice(self.ticker_pool)
        with self.client.post(
            "/watchlist",
            json={"ticker": ticker},
            headers=self._h(),
            name="/watchlist [add]",
            catch_response=True,
        ) as resp:
            # 409 already present, 422 watchlist full: both valid business cases.
            if resp.status_code in (200, 201):
                if ticker not in self.watchlist:
                    self.watchlist.append(ticker)
                resp.success()
            elif resp.status_code in (409, 422):
                resp.success()
            elif resp.status_code >= 500:
                resp.failure(f"add watchlist 5xx: {resp.status_code}")
            else:
                resp.success()

    @task
    def back_to_portfolio(self):
        if not self.token:
            return
        self._shell()
        self.client.get("/portfolio", headers=self._h(), name="/portfolio")

    @task
    def view_watchlist(self):
        if not self.token:
            return
        # Watchlist page = shell (/prices) + /watchlist.
        self.client.get("/prices", name="/prices")
        self.client.get("/watchlist", headers=self._h(), name="/watchlist")

    @task
    def stop(self):
        self.interrupt(reschedule=True)


# ---------------------------------------------------------------------------
# 2. Read-only — browse + open several stock details. Cache-impact flow.
# ---------------------------------------------------------------------------
class ReadOnlyFlow(_Flow):
    """Pure reads, no writes. The EDGAR cache hit rate is the variable here."""

    @task
    def browse_dashboard(self):
        if not self.token:
            return
        self._shell()
        self.client.get("/portfolio", headers=self._h(), name="/portfolio")
        self.client.get("/transactions", headers=self._h(), name="/transactions")

    @task
    def browse_portfolio(self):
        if not self.token:
            return
        self._shell()
        self.client.get("/prices", name="/prices")
        self.client.get("/portfolio", headers=self._h(), name="/portfolio")

    @task
    def browse_watchlist(self):
        if not self.token:
            return
        self.client.get("/prices", name="/prices")
        self.client.get("/watchlist", headers=self._h(), name="/watchlist")

    @task
    def open_a_few_stocks(self):
        # The cache-sensitive part: open 3 stock details in a row.
        for ticker in random.sample(self.ticker_pool, k=min(3, len(self.ticker_pool))):
            self._open_stock_detail(ticker)

    @task
    def stop(self):
        self.interrupt(reschedule=True)


# ---------------------------------------------------------------------------
# 3. Intensive transactional — repeated buy/sell + reloads. Write-heavy.
# ---------------------------------------------------------------------------
class IntensiveTxnFlow(_Flow):
    """Pounds the write path: buy, sell, reload portfolio + transactions."""

    @task
    def open_buy_page(self):
        # BuyFlow loads price + company before the user confirms.
        ticker = random.choice(self.ticker_pool)
        self._buy_target = ticker
        guarded = self.edgar_guard.acquire()
        t = ticker if guarded else HOT_TICKERS[0]
        self.client.get(f"/prices/{t}", name="/prices/[ticker]")
        self.client.get(f"/edgar/companies/{t}", name="/edgar/companies/[ticker]")

    @task
    def buy(self):
        if not self.token:
            return
        ticker = getattr(self, "_buy_target", None) or random.choice(self.ticker_pool)
        payload = {
            "ticker": ticker,
            "quantity": random.randint(1, 5),
            "date": "2026-06-01T00:00:00.000Z",
        }
        with self.client.post(
            "/transactions/buy",
            json=payload,
            headers=self._h(),
            name="/transactions/buy",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 201):
                if ticker not in self.holdings:
                    self.holdings.append(ticker)
                resp.success()
            elif resp.status_code >= 500:
                resp.failure(f"buy 5xx: {resp.status_code}")
            else:
                resp.success()

    @task
    def reload_portfolio(self):
        if not self.token:
            return
        self.client.get("/portfolio", headers=self._h(), name="/portfolio")

    @task
    def view_ticker_ops(self):
        if not self.token or not self.holdings:
            return
        ticker = random.choice(self.holdings)
        self.client.get(
            f"/transactions/{ticker}",
            headers=self._h(),
            name="/transactions/[ticker]",
        )

    @task
    def sell(self):
        if not self.token or not self.holdings:
            return  # never sell what we didn't buy
        ticker = random.choice(self.holdings)
        payload = {
            "ticker": ticker,
            "quantity": 1,
            "date": "2026-06-02T00:00:00.000Z",
        }
        with self.client.post(
            "/transactions/sell",
            json=payload,
            headers=self._h(),
            name="/transactions/sell",
            catch_response=True,
        ) as resp:
            # Selling more than held is a 4xx business rule, not a server error.
            if resp.status_code >= 500:
                resp.failure(f"sell 5xx: {resp.status_code}")
            else:
                resp.success()

    @task
    def reload_transactions(self):
        if not self.token:
            return
        self.client.get("/transactions", headers=self._h(), name="/transactions")

    @task
    def stop(self):
        self.interrupt(reschedule=True)


# ---------------------------------------------------------------------------
# Suite factory. Each suite (load / stress) builds its OWN flow subclasses via
# this helper so that setting ticker_pool / edgar_guard on one suite never
# leaks into the other (the flow classes above are shared templates; we must
# not mutate them in place).
# ---------------------------------------------------------------------------
def build_users(ticker_pool, edgar_guard=None):
    guard = edgar_guard if edgar_guard is not None else _AlwaysAllow()

    def _flow(base):
        return type(
            f"{base.__name__}Configured",
            (base,),
            {"ticker_pool": ticker_pool, "edgar_guard": guard},
        )

    conversion = type("ConversionUser", (HttpUser,),
                      {"abstract": True, "tasks": [_flow(ConversionFlow)]})
    readonly = type("ReadOnlyUser", (HttpUser,),
                    {"abstract": True, "tasks": [_flow(ReadOnlyFlow)]})
    intensive = type("IntensiveTxnUser", (HttpUser,),
                     {"abstract": True, "tasks": [_flow(IntensiveTxnFlow)]})
    return conversion, readonly, intensive
