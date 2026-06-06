import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { AppiumBrowser } from '../support/webdriver.mjs';
import {
  buyInTerminal,
  loginAsNewUser,
  parseMoney,
  sellFromPositionDialog,
  sellInTerminal,
  visitDashboard,
  visitPortfolio,
  visitTransactions,
} from '../support/e2e-helpers.mjs';

const app = new AppiumBrowser();

describe('Portfolio - mobile E2E flows', () => {
  before(async () => {
    await app.start();
  });

  after(async () => {
    await app.stop();
  });

  beforeEach(async () => {
    await loginAsNewUser(app, 'portfolio');
    await visitPortfolio(app);
  });

  it('buys shares and the new position appears in the portfolio', async () => {
    await buyInTerminal(app, 'TSLA', 3);

    await app.waitFor('[data-testid="position-row-TSLA"]', 15000);
  });

  it('sells all shares and the position disappears from the portfolio', async () => {
    await buyInTerminal(app, 'TSLA', 3);
    await app.waitFor('[data-testid="position-row-TSLA"]', 15000);

    await sellFromPositionDialog(app, 'TSLA', 3);
    await visitPortfolio(app);

    await app.waitForGone('[data-testid="position-row-TSLA"]', 15000);
  });

  it('selling a ticker that is not bought or selling more quantity than what I have of a ticker fails', async () => {
    await sellInTerminal(app, 'AAPL', 2);
    await app.waitFor('[data-testid="transaction-error"]', 15000);
    assert.match(
      await app.text('[data-testid="transaction-error"]'),
      /No tenés posición abierta en AAPL/,
    );

    await buyInTerminal(app, 'AAPL', 1);
    await app.waitFor('[data-testid="position-row-AAPL"]', 15000);

    await sellInTerminal(app, 'AAPL', 2);
    await app.waitFor('[data-testid="transaction-error"]', 15000);
    assert.match(
      await app.text('[data-testid="transaction-error"]'),
      /Querés vender 2 acciones pero solo tenés 1/,
    );
  });

  it('buy and sell transactions appear in the transactions page', async () => {
    await buyInTerminal(app, 'AAPL', 2);
    await app.waitFor('[data-testid="position-row-AAPL"]', 15000);

    await sellFromPositionDialog(app, 'AAPL', 1);
    await visitTransactions(app);

    await app.type('[data-testid="filter-ticker"]', 'AAPL');
    await app.select('[data-testid="filter-type"]', 'BUY');
    await app.waitFor('[data-testid="transaction-row"]', 8000);
    assert.equal(
      await app.text('[data-testid="transaction-row-ticker"]'),
      'AAPL',
    );

    await app.select('[data-testid="filter-type"]', 'SELL');
    await app.waitFor('[data-testid="transaction-row"]', 8000);
    assert.equal(
      await app.text('[data-testid="transaction-row-ticker"]'),
      'AAPL',
    );
  });

  it('buying shares makes the position appear on the dashboard', async () => {
    await buyInTerminal(app, 'AAPL', 1);

    await visitDashboard(app);

    await app.waitFor('[data-testid="portfolio-table"]', 15000);
    await app.waitFor('[data-testid="portfolio-row-AAPL"]', 15000);
    await app.waitFor('[data-testid="dashboard-recent-transactions"]', 15000);
    assert.equal(await app.text('[data-testid="transaction-ticker"]'), 'AAPL');
  });

  it('account total value increases after buying more shares', async () => {
    const before = parseMoney(
      await app.text('[data-testid="portfolio-total-value"]'),
    );

    await buyInTerminal(app, 'AAPL', 10);
    await visitPortfolio(app);

    const after = parseMoney(
      await app.text('[data-testid="portfolio-total-value"]'),
    );
    assert.ok(after > before);
  });
});
