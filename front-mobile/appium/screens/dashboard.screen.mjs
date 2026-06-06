export class DashboardScreen {
  constructor(app) {
    this.app = app;
  }

  async open() {
    await this.app.url('/app/dashboard');
    await this.app.waitFor('[data-testid="dashboard"]', 15000);
  }

  async waitForPortfolioRow(ticker) {
    await this.app.waitFor('[data-testid="portfolio-table"]', 15000);
    await this.app.waitFor(`[data-testid="portfolio-row-${ticker}"]`, 15000);
  }

  async waitForRecentTransactions() {
    await this.app.waitFor(
      '[data-testid="dashboard-recent-transactions"]',
      15000,
    );
  }

  async recentTransactionTicker() {
    return this.app.text('[data-testid="transaction-ticker"]');
  }
}
