export class TransactionsScreen {
  constructor(app) {
    this.app = app;
  }

  async open() {
    await this.app.url('/app/transactions');
    await this.app.waitForAny(
      [
        '[data-testid="transactions-list"]',
        '[data-testid="transactions-list-empty"]',
      ],
      15000,
    );
  }

  async filterByTicker(ticker) {
    await this.app.type('[data-testid="filter-ticker"]', ticker);
  }

  async filterByType(type) {
    await this.app.select('[data-testid="filter-type"]', type);
  }

  async waitForRow() {
    await this.app.waitFor('[data-testid="transaction-row"]', 8000);
  }

  async firstRowTicker() {
    return this.app.text('[data-testid="transaction-row-ticker"]');
  }
}
