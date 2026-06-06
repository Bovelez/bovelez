import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeWatchlistItem } from '../../api/watchlist.api';
import { watchlistKeys } from './queryKeys.ts';

export function useRemoveWatchlistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticker: string) => removeWatchlistItem(ticker),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: watchlistKeys.list() });
    },
  });
}
