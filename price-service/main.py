from fastapi import FastAPI
from pydantic import BaseModel
import requests
import yfinance as yf

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


def _get_price_yfinance(ticker: str) -> float:
    """
    Intenta obtener el precio via yfinance.
    yfinance maneja internamente el crumb y cookies de Yahoo Finance.
    Puede fallar en entornos de datacenter (Render, Docker) donde Yahoo Finance
    rate-limita sus endpoints de autenticación.
    """
    t = yf.Ticker(ticker, session=_session)
    hist = t.history(period="5d")
    if hist.empty:
        raise ValueError(f"yfinance: no data for {ticker}")
    return float(hist["Close"].iloc[-1])


def _get_price_direct(ticker: str) -> float:
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
    closes = [c for c in result[0]["indicators"]["quote"][0]["close"] if c is not None]
    if not closes:
        raise ValueError(f"direct: no close prices for {ticker}")
    return float(closes[-1])


def get_price(ticker: str) -> float:
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
    errors: dict[str, str]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/prices/fetch", response_model=FetchResponse)
def fetch_prices(body: FetchRequest):
    prices: dict[str, float] = {}
    errors: dict[str, str] = {}

    for ticker in body.tickers:
        try:
            prices[ticker] = get_price(ticker)
        except Exception as e:
            errors[ticker] = str(e)

    return FetchResponse(prices=prices, errors=errors)
