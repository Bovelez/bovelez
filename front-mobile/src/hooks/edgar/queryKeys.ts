export const edgarKeys = {
  all: ['prices'] as const,
  companies: () => [...edgarKeys.all, 'companies'] as const,
  search: (query: string) => [...edgarKeys.all, 'search', query] as const,
  company: (ticker: string) => [...edgarKeys.companies(), ticker] as const,
  filings: (ticker: string) =>
    [...edgarKeys.company(ticker), 'filings'] as const,
  metrics: (ticker: string, quarters: number) =>
    [...edgarKeys.company(ticker), 'metrics', quarters] as const,
};
