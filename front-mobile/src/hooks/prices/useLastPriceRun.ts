import { useQuery } from '@tanstack/react-query';
import { getLastPriceRun } from '../../api/prices.api';
import { priceKeys } from './queryKeys';

export function useLastPriceRun() {
  return useQuery({
    queryKey: priceKeys.lastRun(),
    queryFn: getLastPriceRun,
  });
}
