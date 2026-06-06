export const priceKeys = {
  all: ['prices'] as const,
  list: () => [...priceKeys.all, 'list'] as const,
  detail: (ticker: string) => [...priceKeys.all, 'detail', ticker] as const,
  lastRun: () => [...priceKeys.all, 'last-run'] as const,
};
