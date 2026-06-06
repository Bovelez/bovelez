import { useQuery } from '@tanstack/react-query';
import { searchEdgarCompanies } from '../../api/edgar.api';
import { edgarKeys } from './queryKeys';

export function useEdgarSearch(query: string) {
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: edgarKeys.search(normalizedQuery),
    queryFn: () => searchEdgarCompanies(normalizedQuery),
    enabled: normalizedQuery.length > 1,
  });
}
