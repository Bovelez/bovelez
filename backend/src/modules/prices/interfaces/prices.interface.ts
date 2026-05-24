export interface IFetchPricesResult {
  prices: Record<string, number>;
  dailyChangePercentages?: Record<string, number | null>;
  errors: Record<string, string>;
}

export interface IYahooFinanceClient {
  fetchPrices(tickers: string[]): Promise<IFetchPricesResult>;
}

export const YAHOO_FINANCE_CLIENT = 'YAHOO_FINANCE_CLIENT';
export const PRICES_REPOSITORY = 'PRICES_REPOSITORY';
