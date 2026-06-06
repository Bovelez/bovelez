export const transactionKeys = {
  all: ['transactions'] as const,
  list: () => [...transactionKeys.all, 'list'] as const,
  byTicker: (ticker: string) =>
    [...transactionKeys.all, 'ticker', ticker] as const,
};
