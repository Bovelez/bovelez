export interface StockPriceRecord {
  ticker: string;
  price: number;
  updatedAt: Date;
}

export interface PriceBatchRunRecord {
  id: string;
  startedAt: Date;
  finishedAt: Date | null;
  tickerCount: number;
  errorCount: number;
  errors: unknown;
}

export interface IPricesRepository {
  upsertPrice(ticker: string, price: number): Promise<StockPriceRecord>;
  findPrice(ticker: string): Promise<StockPriceRecord | null>;
  findPricesByTickers(tickers: string[]): Promise<StockPriceRecord[]>;
  findAllPrices(): Promise<StockPriceRecord[]>;
  createBatchRun(): Promise<PriceBatchRunRecord>;
  finishBatchRun(
    id: string,
    tickerCount: number,
    errorCount: number,
    errors: Record<string, string>,
  ): Promise<PriceBatchRunRecord>;
  findLastBatchRun(): Promise<PriceBatchRunRecord | null>;
}
