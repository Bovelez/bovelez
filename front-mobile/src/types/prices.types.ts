export type StockPrice = {
  ticker: string;
  price: number;
  dailyChangePercent: number | null;
  updatedAt: string;
};

export type PriceBatchRun = {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  tickerCount: number;
  errorCount: number;
  errors: Record<string, string> | null;
};

export type UpdatePricesInput = {
  tickers: string[];
};

export type UpdatePricesResponse = {
  batchId: string;
  startedAt: string;
  finishedAt: string | null;
  tickerCount: number;
  errorCount: number;
  prices: Record<string, number>;
  dailyChangePercentages: Record<string, number | null>;
  errors: Record<string, string>;
};

export type TickerSelectProps = {
  prices: StockPrice[];
  selectedPrice: StockPrice | null;
  isLoading: boolean;
  errorMessage?: string;
  onSelectPrice: (price: StockPrice) => void;
  onClearSelection?: () => void;
};
