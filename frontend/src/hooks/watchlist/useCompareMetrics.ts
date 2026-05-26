import { useMutation } from "@tanstack/react-query";
import { compareWatchlistMetrics } from "../../api/watchlist.api";

export function useCompareMetrics() {
    return useMutation({
        mutationFn: (tickers: string[]) => compareWatchlistMetrics(tickers),
    });
}