import { useQuery } from '@tanstack/react-query';
import { getAllTransactions } from '../../api/transactions.api';
import { transactionKeys } from './queryKeys';

export function useAllTransactions() {
  return useQuery({
    queryKey: transactionKeys.list(),
    queryFn: getAllTransactions,
  });
}
