import { useMemo } from "react";
import type { StockPrice } from "../../types/prices.types";

export function useWatchlistSearch(prices: StockPrice[], query: string) {
    return useMemo(() => {
        const normalized = query.trim().toUpperCase();
        if (!normalized) return [];
        return prices
            .filter((p) => p.ticker.startsWith(normalized))
            .slice(0, 10);
    }, [prices, query]);
}