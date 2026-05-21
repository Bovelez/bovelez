export class PortfolioPositionDto {
  ticker: string;
  quantity: number;
  avgCost: number;
  currentPrice: number | null;
  currentValue: number | null;
  pnl: number | null;
  pnlPercent: number | null;
  hasPrice: boolean;

  constructor(init: {
    ticker: string;
    quantity: number;
    avgCost: number;
    currentPrice: number | null;
  }) {
    this.ticker = init.ticker;
    this.quantity = init.quantity;
    this.avgCost = init.avgCost;
    this.currentPrice = init.currentPrice;
    this.hasPrice = init.currentPrice !== null;

    if (init.currentPrice === null) {
      this.currentValue = null;
      this.pnl = null;
      this.pnlPercent = null;
    } else {
      this.currentValue = init.currentPrice * init.quantity;
      const costBasis = init.avgCost * init.quantity;
      this.pnl = this.currentValue - costBasis;
      this.pnlPercent =
        costBasis === 0 ? 0 : ((this.currentValue - costBasis) / costBasis) * 100;
    }
  }
}

export class PortfolioDto {
  positions: PortfolioPositionDto[];
  totalValue: number;
  lastPriceUpdate: Date | null;

  constructor(positions: PortfolioPositionDto[], lastPriceUpdate: Date | null) {
    this.positions = positions;
    this.totalValue = positions.reduce((sum, p) => sum + (p.currentValue ?? 0), 0);
    this.lastPriceUpdate = lastPriceUpdate;
  }
}
