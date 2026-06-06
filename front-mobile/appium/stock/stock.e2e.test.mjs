import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { StockScreen } from '../screens/stock.screen.mjs';
import { TransactionsScreen } from '../screens/transactions.screen.mjs';
import { loginAsNewUser } from '../support/test-data.mjs';
import { AppiumBrowser } from '../support/webdriver.mjs';

const app = new AppiumBrowser();
const stock = new StockScreen(app);
const transactions = new TransactionsScreen(app);

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
    await stock.open('AAPL');

    await stock.openMetricsTab();
    if (await stock.hasMetricsTab()) {
      assert.equal(await stock.metricCardCount(), 5);
    }

    await stock.openFilingsTab();

    await stock.openQuartersTab();
  });

  it('compra desde la página de stock y la posición aparece en el portfolio', async () => {
    await stock.buyFromStockPage('AAPL');

    assert.match(await stock.buyConfirmationText(), /Compra registrada/);
    await stock.goToPortfolioFromBuyConfirmation();

    await app.waitFor('[data-testid="position-row-AAPL"]', 15000);
  });

  it('vende desde la página de stock y la transacción queda registrada', async () => {
    await stock.buyFromStockPage('AAPL');
    await stock.buyFromStockPage('AAPL');

    await stock.sellFromStockPage('AAPL');

    assert.match(await stock.sellConfirmationText(), /Venta registrada/);

    await transactions.open();
    await transactions.filterByTicker('AAPL');
    await transactions.filterByType('SELL');

    await transactions.waitForRow();
  });
});
