import assert from 'node:assert/strict';

export class PortfolioScreen {
  constructor(app) {
    this.app = app;
  }

  async open() {
    await this.app.url('/app/portfolio');
    await this.app.waitFor('[data-testid="active-shares"]', 15000);
  }

  async selectTickerInTerminal(ticker) {
    if (!(await this.app.exists('[data-testid="transaction-panel"]'))) {
      await this.app.click('[data-testid="toggle-terminal"]');
    }

    await this.app.type('[data-testid="edgar-ticker-search"]', ticker);
    await this.app.click(`[data-testid="edgar-company-${ticker}"]`);
    assert.equal(
      await this.app.text('[data-testid="transaction-selected-ticker"]'),
      ticker,
    );
  }

  async buyInTerminal(ticker, quantity) {
    await this.selectTickerInTerminal(ticker);
    await this.app.type(
      '[data-testid="transaction-quantity"]',
      String(quantity),
    );
    await this.app.click('[data-testid="transaction-buy-btn"]');
    await this.app.waitFor('[data-testid="transaction-success"]', 15000);
  }

  async sellInTerminal(ticker, quantity) {
    await this.selectTickerInTerminal(ticker);
    await this.app.type(
      '[data-testid="transaction-quantity"]',
      String(quantity),
    );
    await this.app.click('[data-testid="transaction-sell-btn"]');
  }

  async sellFromPositionDialog(ticker, quantity) {
    await this.app.click(`[data-testid="position-row-${ticker}"]`);
    await this.app.waitFor('[data-testid="ticker-dialog"]', 10000);
    await this.app.type(
      '[data-testid="ticker-dialog-sell-quantity"]',
      String(quantity),
    );
    await this.app.waitForEnabled(
      '[data-testid="ticker-dialog-sell-btn"]',
      10000,
    );
    await this.app.domClick('[data-testid="ticker-dialog-sell-btn"]');
    await this.app.waitFor('[data-testid="ticker-dialog-sell-success"]', 15000);
    await this.app.domClick('[data-testid="ticker-dialog-close"]');
  }

  async waitForPosition(ticker) {
    await this.app.waitFor(`[data-testid="position-row-${ticker}"]`, 15000);
  }

  async waitForPositionGone(ticker) {
    await this.app.waitForGone(`[data-testid="position-row-${ticker}"]`, 15000);
  }

  async transactionErrorText() {
    await this.app.waitFor('[data-testid="transaction-error"]', 15000);
    return this.app.text('[data-testid="transaction-error"]');
  }

  async totalValue() {
    const text = await this.app.text('[data-testid="portfolio-total-value"]');
    return Number(text.replace(/[^0-9.-]/g, ''));
  }
}
