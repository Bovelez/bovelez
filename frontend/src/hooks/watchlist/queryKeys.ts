export const watchlistKeys = {
    all: () => ["watchlist"] as const,
    list: () => [...watchlistKeys.all(), "list"] as const,
    compare: (tickers: string[]) => [...watchlistKeys.all(), "compare", tickers] as const,
};