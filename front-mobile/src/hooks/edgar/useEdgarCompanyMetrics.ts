import { useQuery } from '@tanstack/react-query';
import { getEdgarCompanyMetrics } from '../../api/edgar.api';
import { edgarKeys } from './queryKeys';

export function useEdgarCompanyMetrics(ticker: string | null, quarters = 4) {
  return useQuery({
    queryKey: edgarKeys.metrics(ticker ?? '', quarters),
    queryFn: () => getEdgarCompanyMetrics(ticker ?? '', quarters),
    enabled: Boolean(ticker),
  });
}
