from fastapi import FastAPI
from pydantic import BaseModel
import requests

app = FastAPI()

# yfinance falla desde Docker porque Yahoo Finance bloquea requests sin
# User-Agent de browser. Consumimos la misma API de Yahoo Finance directamente
# con headers adecuados, que es exactamente lo que yfinance hace internamente.
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
}

def get_price(ticker: str) -> float:
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
    r = requests.get(url, headers=HEADERS, params={"interval": "1d", "range": "5d"}, timeout=10)
    r.raise_for_status()
    data = r.json()
    result = data.get("chart", {}).get("result")
    if not result:
        raise ValueError("No result in response")
    closes = [c for c in result[0]["indicators"]["quote"][0]["close"] if c is not None]
    if not closes:
        raise ValueError("No close prices found")
    return float(closes[-1])

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
