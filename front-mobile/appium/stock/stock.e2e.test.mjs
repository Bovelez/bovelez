import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { AppiumBrowser } from '../support/webdriver.mjs';
import {
  loginAsNewUser,
  visitStock,
  visitTransactions,
} from '../support/e2e-helpers.mjs';

const app = new AppiumBrowser();

async function buyFromStockPage(ticker, quantity = 1) {
  await visitStock(app, ticker);
  await app.click('[data-testid="stock-buy-btn"]');
  await app.waitForUrl(new RegExp(`/app/stock/${ticker}/buy$`), 10000);
  if (quantity !== 1)
    await app.type('[data-testid="buyflow-qty-input"]', String(quantity));
  await app.click('[data-testid="buyflow-confirm-btn"]');
  await app.waitFor('[data-testid="buyflow-confirmed"]', 15000);
}

describe('Stock - mobile E2E flows', () => {
  before(async () => {
    await app.start();
  });

  after(async () => {
    await app.stop();
  });

  beforeEach(async () => {
    await loginAsNewUser(app, 'stock');
  });

  it('navega entre los tabs y muestra contenido en cada uno', async () => {
    await visitStock(app, 'AAPL');

    await app.click('[data-testid="stock-tab-métricas"]');
    await app.waitForAny(
      ['[data-testid="metricas-tab"]', '[data-testid="metricas-error"]'],
      8000,
    );
    if (await app.exists('[data-testid="metricas-tab"]')) {
      assert.equal(await app.count('[data-testid="metric-card"]'), 5);
    }

    await app.click('[data-testid="stock-tab-filings"]');
    await app.waitFor('[data-testid="filings-tab"]', 8000);
    await app.waitForAny(
      ['[data-testid="filing-row"]', '[data-testid="filings-empty"]'],
      8000,
    );

    await app.click('[data-testid="stock-tab-trimestres"]');
    await app.waitForAny(
      ['[data-testid="trimestres-tab"]', '[data-testid="trimestres-no-data"]'],
      8000,
    );
  });

  it('compra desde la página de stock y la posición aparece en el portfolio', async () => {
    await buyFromStockPage('AAPL');

    assert.match(
      await app.text('[data-testid="buyflow-confirmed"]'),
      /Compra registrada/,
    );
    await app.click('[data-testid="buyflow-go-portfolio"]');
    await app.waitForUrl(/\/app\/portfolio$/, 10000);

    await app.waitFor('[data-testid="position-row-AAPL"]', 15000);
  });

  it('vende desde la página de stock y la transacción queda registrada', async () => {
    await buyFromStockPage('AAPL');
    await buyFromStockPage('AAPL');

    await visitStock(app, 'AAPL');
    await app.click('[data-testid="stock-sell-btn"]');
    await app.waitForUrl(/\/app\/stock\/AAPL\/sell$/, 10000);
    await app.waitForEnabled('[data-testid="sell-confirm-btn"]', 10000);
    await app.domClick('[data-testid="sell-confirm-btn"]');

    await app.waitFor('[data-testid="sell-confirmed"]', 15000);
    assert.match(
      await app.text('[data-testid="sell-confirmed"]'),
      /Venta registrada/,
    );

    await visitTransactions(app);
    await app.type('[data-testid="filter-ticker"]', 'AAPL');
    await app.select('[data-testid="filter-type"]', 'SELL');

    await app.waitFor('[data-testid="transaction-row"]', 8000);
  });
});
