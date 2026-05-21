//PortfolioPositionDto exists separately from PositionDto is that P&L 
// can only be calculated when you have a current price, and fetching prices
//  for every individual GET /portfolio/positions/:id call would be wasteful.
//  The split makes it explicit in the type system: if you get a PositionDto, 
// there's no price data; if you get a PortfolioPositionDto, there is.

export class PortfolioPositionDto {
  id: string;
  ticker: string;
  quantity: number;
  buyPrice: number;
  buyDate: Date;
  currentPrice: number | null;
  currentValue: number | null;
  pnl: number | null;
  pnlPercent: number | null;
  hasPrice: boolean;

  constructor(init: {
    id: string;
    ticker: string;
    quantity: number;
    buyPrice: number;
    buyDate: Date;
    currentPrice: number | null;
  }) {
    this.id = init.id;
    this.ticker = init.ticker;
    this.quantity = init.quantity;
    this.buyPrice = init.buyPrice;
    this.buyDate = init.buyDate;
    this.currentPrice = init.currentPrice;
    this.hasPrice = init.currentPrice !== null;

    if (init.currentPrice === null) {
      this.currentValue = null;
      this.pnl = null;
      this.pnlPercent = null;
    } else {
      this.currentValue = init.currentPrice * init.quantity;
      const costBasis = init.buyPrice * init.quantity;
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

  constructor(
    positions: PortfolioPositionDto[],
    lastPriceUpdate: Date | null,
  ) {
    this.positions = positions;
    this.totalValue = positions.reduce(
      (sum, p) => sum + (p.currentValue ?? 0),
      0,
    );
    this.lastPriceUpdate = lastPriceUpdate;
  }
}
