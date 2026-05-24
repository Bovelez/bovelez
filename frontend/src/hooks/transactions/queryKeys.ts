export const transactionKeys = {
  all: ["transactions"] as const,
  byTicker: (ticker: string) =>
    [...transactionKeys.all, "ticker", ticker] as const,
};
