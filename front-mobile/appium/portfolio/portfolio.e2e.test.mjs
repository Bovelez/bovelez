import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { DashboardScreen } from '../screens/dashboard.screen.mjs';
import { PortfolioScreen } from '../screens/portfolio.screen.mjs';
import { TransactionsScreen } from '../screens/transactions.screen.mjs';
import { loginAsNewUser } from '../support/test-data.mjs';
import { AppiumBrowser } from '../support/webdriver.mjs';

const app = new AppiumBrowser();
const dashboard = new DashboardScreen(app);
const portfolio = new PortfolioScreen(app);
const transactions = new TransactionsScreen(app);

describe('Portfolio - mobile E2E flows', () => {
  before(async () => {
    await app.start();
  });

  after(async () => {
    await app.stop();
  });

  beforeEach(async () => {
    await loginAsNewUser(app, 'portfolio');
    await portfolio.open();
  });

  it('buys shares and the new position appears in the portfolio', async () => {
    await portfolio.buyInTerminal('TSLA', 3);

    await portfolio.waitForPosition('TSLA');
  });

  it('sells all shares and the position disappears from the portfolio', async () => {
    await portfolio.buyInTerminal('TSLA', 3);
    await portfolio.waitForPosition('TSLA');

    await portfolio.sellFromPositionDialog('TSLA', 3);
    await portfolio.open();

    await portfolio.waitForPositionGone('TSLA');
  });

  it('selling a ticker that is not bought or selling more quantity than what I have of a ticker fails', async () => {
    await portfolio.sellInTerminal('AAPL', 2);
    assert.match(
      await portfolio.transactionErrorText(),
      /No tenés posición abierta en AAPL/,
    );

    await portfolio.buyInTerminal('AAPL', 1);
    await portfolio.waitForPosition('AAPL');

    await portfolio.sellInTerminal('AAPL', 2);
    assert.match(
      await portfolio.transactionErrorText(),
      /Querés vender 2 acciones pero solo tenés 1/,
    );
  });

  it('buy and sell transactions appear in the transactions page', async () => {
    await portfolio.buyInTerminal('AAPL', 2);
    await portfolio.waitForPosition('AAPL');

    await portfolio.sellFromPositionDialog('AAPL', 1);
    await transactions.open();

    await transactions.filterByTicker('AAPL');
    await transactions.filterByType('BUY');
    await transactions.waitForRow();
    assert.equal(await transactions.firstRowTicker(), 'AAPL');

    await transactions.filterByType('SELL');
    await transactions.waitForRow();
    assert.equal(await transactions.firstRowTicker(), 'AAPL');
  });

  it('buying shares makes the position appear on the dashboard', async () => {
    await portfolio.buyInTerminal('AAPL', 1);

    await dashboard.open();

    await dashboard.waitForPortfolioRow('AAPL');
    await dashboard.waitForRecentTransactions();
    assert.equal(await dashboard.recentTransactionTicker(), 'AAPL');
  });

  it('account total value increases after buying more shares', async () => {
    const before = await portfolio.totalValue();

    await portfolio.buyInTerminal('AAPL', 10);
    await portfolio.open();

    const after = await portfolio.totalValue();
    assert.ok(after > before);
  });
});
