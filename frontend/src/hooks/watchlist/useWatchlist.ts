import { useQuery } from "@tanstack/react-query";
import { getWatchlist } from "../../api/watchlist.api";
import { watchlistKeys } from "./queryKeys";

export function useWatchlist() {
    return useQuery({
        queryKey: watchlistKeys.list(),
        queryFn: getWatchlist,
    });
}