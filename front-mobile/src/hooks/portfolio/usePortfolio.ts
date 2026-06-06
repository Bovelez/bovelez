import { useQuery } from '@tanstack/react-query';
import { getPortfolio } from '../../api/portfolio.api';
import { portfolioKeys } from './queryKeys';

export function usePortfolio() {
  return useQuery({
    queryKey: portfolioKeys.detail(),
    queryFn: getPortfolio,
  });
}
