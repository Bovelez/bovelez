export class WatchlistScreen {
  constructor(app) {
    this.app = app;
  }

  async open() {
    await this.app.url('/app/watchlist');
    await this.app.waitFor('[data-testid="watchlist-page"]', 15000);
    await this.app.waitFor('[data-testid="watchlist-list"]', 15000);
  }

  async addTicker(ticker) {
    await this.app.type('[data-testid="ticker-input"]', ticker);
    await this.app.click('[data-testid="add-ticker-btn"]');
    await this.app.waitFor('[data-testid="add-success"]', 8000);
  }

  async removeTicker(ticker) {
    await this.app.click(`[data-testid="watchlist-remove-${ticker}"]`);
    await this.app.click('[data-testid="remove-confirm-btn"]');
  }

  async waitForTicker(ticker) {
    await this.app.waitFor(`[data-testid="watchlist-item-${ticker}"]`, 8000);
  }

  async waitForTickerGone(ticker) {
    await this.app.waitForGone(
      `[data-testid="watchlist-item-${ticker}"]`,
      8000,
    );
  }

  async openCompareTab() {
    await this.app.click('[data-testid="watchlist-tabs-comparar"]');
    await this.app.waitFor('[data-testid="compare-section"]', 8000);
  }

  async selectCompareTicker(ticker) {
    await this.app.click(
      `[data-testid="compare-ticker-chip"][data-ticker="${ticker}"]`,
    );
  }

  async compareSelected() {
    await this.app.click('[data-testid="compare-btn"]');
    await this.app.waitFor('[data-testid="compare-table"]', 15000);
  }

  async compareColumnCount() {
    return this.app.count('[data-testid="compare-col-header"]');
  }

  async metricValueCount() {
    return this.app.count('[data-testid="metric-value"]');
  }
}
