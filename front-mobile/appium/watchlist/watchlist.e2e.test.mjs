import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { AppiumBrowser } from '../support/webdriver.mjs';
import {
  ensureInWatchlist,
  ensureNotInWatchlist,
  loginAsNewUser,
  visitStock,
  visitWatchlist,
} from '../support/e2e-helpers.mjs';

const app = new AppiumBrowser();
let user;

describe('Watchlist - mobile E2E flows', () => {
  before(async () => {
    await app.start();
  });

  after(async () => {
    await app.stop();
  });

  beforeEach(async () => {
    user = await loginAsNewUser(app, 'watchlist');
    await visitWatchlist(app);
  });

  it('adds a ticker from the watchlist page and it appears in the list', async () => {
    await ensureNotInWatchlist(user.token, 'TSLA');
    await visitWatchlist(app);

    await app.type('[data-testid="ticker-input"]', 'TSLA');
    await app.click('[data-testid="add-ticker-btn"]');

    await app.waitFor('[data-testid="add-success"]', 8000);
    await app.waitFor('[data-testid="watchlist-item-TSLA"]', 8000);
  });

  it('removes a ticker and it disappears from the list', async () => {
    await ensureInWatchlist(user.token, 'AAPL');
    await ensureInWatchlist(user.token, 'TSLA');
    await visitWatchlist(app);

    await app.click('[data-testid="watchlist-remove-TSLA"]');
    await app.click('[data-testid="remove-confirm-btn"]');

    await app.waitForGone('[data-testid="watchlist-item-TSLA"]', 8000);
  });

  it('adds a ticker to the watchlist from the stock detail page', async () => {
    await visitStock(app, 'TSLA');

    await app.waitForText(/Agregar a Watchlist/, 8000);
    assert.doesNotMatch(
      await app.text('[data-testid="watchlist-toggle"]'),
      /En Watchlist/,
    );
    await app.click('[data-testid="watchlist-toggle"]');
    await app.waitForText(/En Watchlist/, 8000);

    await visitWatchlist(app);
    await app.waitFor('[data-testid="watchlist-item-TSLA"]', 8000);
  });

  it('compara dos tickers y muestra la tabla de métricas', async () => {
    await ensureInWatchlist(user.token, 'AAPL');
    await ensureInWatchlist(user.token, 'MSFT');
    await visitWatchlist(app);

    await app.click('[data-testid="watchlist-tabs-comparar"]');
    await app.waitFor('[data-testid="compare-section"]', 8000);

    await app.click('[data-testid="compare-ticker-chip"][data-ticker="AAPL"]');
    await app.click('[data-testid="compare-ticker-chip"][data-ticker="MSFT"]');
    await app.click('[data-testid="compare-btn"]');

    await app.waitFor('[data-testid="compare-table"]', 15000);
    assert.equal(await app.count('[data-testid="compare-col-header"]'), 2);
    assert.ok((await app.count('[data-testid="metric-value"]')) >= 1);
  });
});
