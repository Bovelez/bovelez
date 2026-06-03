from fastapi import FastAPI
from pydantic import BaseModel
import requests
import yfinance as yf
from concurrent.futures import ThreadPoolExecutor, as_completed

app = FastAPI()

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
}

# Sesión compartida con User-Agent de browser.
# yfinance maneja su propio crumb usando esta sesión.
_session = requests.Session()
_session.headers.update(HEADERS)


def _get_daily_change_percent(price: float, previous_close: float | None) -> float | None:
    if previous_close is None or previous_close == 0:
        return None
    return ((price - previous_close) / previous_close) * 100


def _get_fast_info_value(fast_info, keys: list[str]) -> float | None:
    for key in keys:
        try:
            value = fast_info.get(key)
        except Exception:
            value = None
        if value is not None:
            return float(value)
    return None


def _get_price_yfinance(ticker: str) -> tuple[float, float | None]:
    """
    Intenta obtener el precio via yfinance.
    yfinance maneja internamente el crumb y cookies de Yahoo Finance.
    Puede fallar en entornos de datacenter (Render, Docker) donde Yahoo Finance
    rate-limita sus endpoints de autenticación.
    """
    t = yf.Ticker(ticker, session=_session)
    fast_info = t.fast_info
    price = _get_fast_info_value(fast_info, ["lastPrice", "last_price"])
    previous_close = _get_fast_info_value(
        fast_info,
        [
            "regularMarketPreviousClose",
            "regular_market_previous_close",
            "previousClose",
            "previous_close",
        ],
    )
    if price is not None and previous_close is not None:
        return price, _get_daily_change_percent(price, previous_close)

    hist = t.history(period="5d")
    if hist.empty:
        raise ValueError(f"yfinance: no data for {ticker}")
    closes = [float(close) for close in hist["Close"].dropna()]
    price = price if price is not None else closes[-1]
    previous_close = closes[-2] if len(closes) > 1 else None
    return price, _get_daily_change_percent(price, previous_close)


def _get_price_direct(ticker: str) -> tuple[float, float | None]:
    """
    Fallback: consulta directamente el endpoint v8 de Yahoo Finance.
    Este endpoint acepta requests con User-Agent de browser sin requerir
    el flujo de autenticación que yfinance usa, por lo que funciona
    desde IPs de datacenter (Render, Docker) donde yfinance es rate-limited.
    """
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
    r = requests.get(url, headers=HEADERS, params={"interval": "1d", "range": "5d"}, timeout=10)
    r.raise_for_status()
    data = r.json()
    result = data.get("chart", {}).get("result")
    if not result:
        raise ValueError(f"direct: no result for {ticker}")
    result = result[0]
    meta = result.get("meta", {})
    closes = [c for c in result["indicators"]["quote"][0]["close"] if c is not None]
    if not closes:
        raise ValueError(f"direct: no close prices for {ticker}")
    price = float(meta.get("regularMarketPrice") or closes[-1])
    change_percent = meta.get("regularMarketChangePercent")
    if change_percent is not None:
        return price, float(change_percent)

    previous_close = closes[-2] if len(closes) > 1 else meta.get("chartPreviousClose")

    return price, _get_daily_change_percent(
        price,
        float(previous_close) if previous_close is not None else None,
    )


def get_price(ticker: str) -> tuple[float, float | None]:
    """
    Obtiene el último precio de cierre disponible para el ticker.
    Estrategia:
      1. yfinance con sesión autenticada (preferido)
      2. HTTP directo a Yahoo Finance v8 si yfinance es rate-limited
    """
    try:
        return _get_price_yfinance(ticker)
    except Exception:
        return _get_price_direct(ticker)


class FetchRequest(BaseModel):
    tickers: list[str]


class FetchResponse(BaseModel):
    prices: dict[str, float]
    dailyChangePercentages: dict[str, float | None]
    errors: dict[str, str]


@app.get("/health")
def health():
    return {"status": "ok"}


MAX_WORKERS = 40

@app.post("/prices/fetch", response_model=FetchResponse)
def fetch_prices(body: FetchRequest):
    prices: dict[str, float] = {}
    daily_change_percentages: dict[str, float | None] = {}
    errors: dict[str, str] = {}

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_ticker = {executor.submit(get_price, ticker): ticker for ticker in body.tickers}
        for future in as_completed(future_to_ticker):
            ticker = future_to_ticker[future]
            try:
                price, daily_change_percent = future.result()
                prices[ticker] = price
                daily_change_percentages[ticker] = daily_change_percent
            except Exception as e:
                errors[ticker] = str(e)

    return FetchResponse(
        prices=prices,
        dailyChangePercentages=daily_change_percentages,
        errors=errors,
    )
