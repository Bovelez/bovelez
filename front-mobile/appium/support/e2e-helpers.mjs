import assert from 'node:assert/strict';

const API_BASE_URL = process.env.MOBILE_E2E_API_URL ?? 'http://localhost:18080';
const PASSWORD = 'Password123';

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export function uniqueEmail(prefix) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 100000)}@example.com`;
}

export async function apiRequest(
  path,
  { method = 'GET', body, token, failOnStatusCode = true } = {},
) {
  const response = await fetch(apiUrl(path), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : undefined;

  if (failOnStatusCode && !response.ok) {
    throw new Error(
      `${method} ${path} failed with ${response.status}: ${text}`,
    );
  }

  return { status: response.status, body: payload };
}

export async function registerUser(prefix = 'appium') {
  const email = uniqueEmail(prefix);
  const { body } = await apiRequest('/auth/register', {
    method: 'POST',
    body: {
      name: 'Appium User',
      email,
      password: PASSWORD,
    },
  });

  assert.ok(body?.token, 'register response should include a token');
  return { email, password: PASSWORD, token: body.token };
}

export async function loginAsNewUser(app, prefix = 'appium') {
  const user = await registerUser(prefix);
  await app.url('/');
  await app.clearBrowserStorage();
  await app.execute(
    "window.localStorage.setItem('auth_token', arguments[0]);",
    [user.token],
  );
  return user;
}

export async function visitDashboard(app) {
  await app.url('/app/dashboard');
  await app.waitFor('[data-testid="dashboard"]', 15000);
}

export async function visitPortfolio(app) {
  await app.url('/app/portfolio');
  await app.waitFor('[data-testid="active-shares"]', 15000);
}

export async function visitStock(app, ticker) {
  await app.url(`/app/stock/${ticker}`);
  await app.waitFor('[data-testid="stock-detail"]', 15000);
}

export async function visitTransactions(app) {
  await app.url('/app/transactions');
  await app.waitForAny(
    [
      '[data-testid="transactions-list"]',
      '[data-testid="transactions-list-empty"]',
    ],
    15000,
  );
}

export async function visitWatchlist(app) {
  await app.url('/app/watchlist');
  await app.waitFor('[data-testid="watchlist-page"]', 15000);
  await app.waitFor('[data-testid="watchlist-list"]', 15000);
}

export async function selectTickerInTerminal(app, ticker) {
  if (!(await app.exists('[data-testid="transaction-panel"]'))) {
    await app.click('[data-testid="toggle-terminal"]');
  }
  await app.type('[data-testid="edgar-ticker-search"]', ticker);
  await app.click(`[data-testid="edgar-company-${ticker}"]`);
  assert.equal(
    await app.text('[data-testid="transaction-selected-ticker"]'),
    ticker,
  );
}

export async function buyInTerminal(app, ticker, quantity) {
  await selectTickerInTerminal(app, ticker);
  await app.type('[data-testid="transaction-quantity"]', String(quantity));
  await app.click('[data-testid="transaction-buy-btn"]');
  await app.waitFor('[data-testid="transaction-success"]', 15000);
}

export async function sellInTerminal(app, ticker, quantity) {
  await selectTickerInTerminal(app, ticker);
  await app.type('[data-testid="transaction-quantity"]', String(quantity));
  await app.click('[data-testid="transaction-sell-btn"]');
}

export async function sellFromPositionDialog(app, ticker, quantity) {
  await app.click(`[data-testid="position-row-${ticker}"]`);
  await app.waitFor('[data-testid="ticker-dialog"]', 10000);
  await app.type(
    '[data-testid="ticker-dialog-sell-quantity"]',
    String(quantity),
  );
  await app.waitForEnabled('[data-testid="ticker-dialog-sell-btn"]', 10000);
  await app.domClick('[data-testid="ticker-dialog-sell-btn"]');
  await app.waitFor('[data-testid="ticker-dialog-sell-success"]', 15000);
  await app.domClick('[data-testid="ticker-dialog-close"]');
}

export async function ensureInWatchlist(token, ticker) {
  await apiRequest('/watchlist', {
    method: 'POST',
    token,
    body: { ticker },
    failOnStatusCode: false,
  });
}

export async function ensureNotInWatchlist(token, ticker) {
  await apiRequest(`/watchlist/${ticker}`, {
    method: 'DELETE',
    token,
    failOnStatusCode: false,
  });
}

export function parseMoney(text) {
  return Number(text.replace(/[^0-9.-]/g, ''));
}
