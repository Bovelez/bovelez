import { useQuery } from '@tanstack/react-query';
import { getTickerTransactions } from '../../api/transactions.api';
import { transactionKeys } from './queryKeys';

export function useTickerTransactions(ticker: string | null) {
  return useQuery({
    queryKey: transactionKeys.byTicker(ticker ?? ''),
    queryFn: () => getTickerTransactions(ticker ?? ''),
    enabled: Boolean(ticker),
  });
}
