import type {StockPrice} from "../../types/prices.types.ts";

export function useGetTickerSuggestions(
    prices: StockPrice[],
    rawQuery: string,
    suggestionLimit: number = 8,
    selectedTicker?: string,
): StockPrice[] {
    const query = rawQuery.trim().toUpperCase();

    if (!query) return prices.slice(0, suggestionLimit);

    const selectedPrice = prices.find((price) => price.ticker === selectedTicker);
    if (selectedPrice && query === selectedPrice.ticker) return [selectedPrice];

    return prices
        .filter((price) => price.ticker.includes(query))
        .sort((a, b) => {
            const aStarts = a.ticker.startsWith(query);
            const bStarts = b.ticker.startsWith(query);
            if (aStarts !== bStarts) return aStarts ? -1 : 1;
            return a.ticker.localeCompare(b.ticker);
        })
        .slice(0, suggestionLimit);
}