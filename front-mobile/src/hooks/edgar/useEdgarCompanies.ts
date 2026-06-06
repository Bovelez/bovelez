import { useQuery } from '@tanstack/react-query';
import { getEdgarCompanies } from '../../api/edgar.api';
import { edgarKeys } from './queryKeys';

export function useEdgarCompanies() {
  return useQuery({
    queryKey: edgarKeys.companies(),
    queryFn: getEdgarCompanies,
  });
}
