import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addWatchlistItem } from "../../api/watchlist.api";
import { watchlistKeys } from "./queryKeys";

export function useAddWatchlistItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (ticker: string) => addWatchlistItem(ticker),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: watchlistKeys.list() });
        },
    });
}