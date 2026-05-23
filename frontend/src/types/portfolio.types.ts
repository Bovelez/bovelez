export type PortfolioPosition = {
  ticker: string;
  quantity: number;
  avgCost: number;
  currentPrice: number | null;
  currentValue: number | null;
  pnl: number | null;
  pnlPercent: number | null;
  hasPrice: boolean;
};

export type Portfolio = {
  positions: PortfolioPosition[];
  totalValue: number;
  lastPriceUpdate: string | null;
};

export type ActiveSharesProps = {
  portfolio?: Portfolio;
  isLoading: boolean;
  errorMessage?: string;
};
