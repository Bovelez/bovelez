import type { EdgarCompany } from "./edgar.types";

export type StockPrice = {
  ticker: string;
  price: number;
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
  errors: Record<string, string>;
};

export type PricedEdgarCompany = EdgarCompany & {
  price: number | null;
  priceUpdatedAt: string | null;
};
