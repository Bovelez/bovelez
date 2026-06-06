export class StockScreen {
  constructor(app) {
    this.app = app;
  }

  async open(ticker) {
    await this.app.url(`/app/stock/${ticker}`);
    await this.app.waitFor('[data-testid="stock-detail"]', 15000);
  }

  async buyFromStockPage(ticker, quantity = 1) {
    await this.open(ticker);
    await this.app.click('[data-testid="stock-buy-btn"]');
    await this.app.waitForUrl(new RegExp(`/app/stock/${ticker}/buy$`), 10000);
    if (quantity !== 1) {
      await this.app.type(
        '[data-testid="buyflow-qty-input"]',
        String(quantity),
      );
    }
    await this.app.click('[data-testid="buyflow-confirm-btn"]');
    await this.app.waitFor('[data-testid="buyflow-confirmed"]', 15000);
  }

  async sellFromStockPage(ticker) {
    await this.open(ticker);
    await this.app.click('[data-testid="stock-sell-btn"]');
    await this.app.waitForUrl(new RegExp(`/app/stock/${ticker}/sell$`), 10000);
    await this.app.waitForEnabled('[data-testid="sell-confirm-btn"]', 10000);
    await this.app.domClick('[data-testid="sell-confirm-btn"]');
    await this.app.waitFor('[data-testid="sell-confirmed"]', 15000);
  }

  async buyConfirmationText() {
    return this.app.text('[data-testid="buyflow-confirmed"]');
  }

  async sellConfirmationText() {
    return this.app.text('[data-testid="sell-confirmed"]');
  }

  async goToPortfolioFromBuyConfirmation() {
    await this.app.click('[data-testid="buyflow-go-portfolio"]');
    await this.app.waitForUrl(/\/app\/portfolio$/, 10000);
  }

  async openMetricsTab() {
    await this.app.click('[data-testid="stock-tab-métricas"]');
    await this.app.waitForAny(
      ['[data-testid="metricas-tab"]', '[data-testid="metricas-error"]'],
      8000,
    );
  }

  async openFilingsTab() {
    await this.app.click('[data-testid="stock-tab-filings"]');
    await this.app.waitFor('[data-testid="filings-tab"]', 8000);
    await this.app.waitForAny(
      ['[data-testid="filing-row"]', '[data-testid="filings-empty"]'],
      8000,
    );
  }

  async openQuartersTab() {
    await this.app.click('[data-testid="stock-tab-trimestres"]');
    await this.app.waitForAny(
      ['[data-testid="trimestres-tab"]', '[data-testid="trimestres-no-data"]'],
      8000,
    );
  }

  async hasMetricsTab() {
    return this.app.exists('[data-testid="metricas-tab"]');
  }

  async metricCardCount() {
    return this.app.count('[data-testid="metric-card"]');
  }

  async addToWatchlist() {
    await this.app.waitForText(/Agregar a Watchlist/, 8000);
    await this.app.click('[data-testid="watchlist-toggle"]');
    await this.app.waitForText(/En Watchlist/, 8000);
  }

  async watchlistToggleText() {
    return this.app.text('[data-testid="watchlist-toggle"]');
  }
}
