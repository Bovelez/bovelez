import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { StockScreen } from '../screens/stock.screen.mjs';
import { WatchlistScreen } from '../screens/watchlist.screen.mjs';
import {
  ensureInWatchlist,
  ensureNotInWatchlist,
  loginAsNewUser,
} from '../support/test-data.mjs';
import { AppiumBrowser } from '../support/webdriver.mjs';

const app = new AppiumBrowser();
const stock = new StockScreen(app);
const watchlist = new WatchlistScreen(app);
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
    await watchlist.open();
  });

  it('adds a ticker from the watchlist page and it appears in the list', async () => {
    await ensureNotInWatchlist(user.token, 'TSLA');
    await watchlist.open();

    await watchlist.addTicker('TSLA');
    await watchlist.waitForTicker('TSLA');
  });

  it('removes a ticker and it disappears from the list', async () => {
    await ensureInWatchlist(user.token, 'AAPL');
    await ensureInWatchlist(user.token, 'TSLA');
    await watchlist.open();

    await watchlist.removeTicker('TSLA');

    await watchlist.waitForTickerGone('TSLA');
  });

  it('adds a ticker to the watchlist from the stock detail page', async () => {
    await stock.open('TSLA');

    assert.doesNotMatch(await stock.watchlistToggleText(), /En Watchlist/);
    await stock.addToWatchlist();

    await watchlist.open();
    await watchlist.waitForTicker('TSLA');
  });

  it('compara dos tickers y muestra la tabla de métricas', async () => {
    await ensureInWatchlist(user.token, 'AAPL');
    await ensureInWatchlist(user.token, 'MSFT');
    await watchlist.open();

    await watchlist.openCompareTab();

    await watchlist.selectCompareTicker('AAPL');
    await watchlist.selectCompareTicker('MSFT');
    await watchlist.compareSelected();

    assert.equal(await watchlist.compareColumnCount(), 2);
    assert.ok((await watchlist.metricValueCount()) >= 1);
  });
});
