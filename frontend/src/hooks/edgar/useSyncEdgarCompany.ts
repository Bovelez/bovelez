import { useMutation, useQueryClient } from "@tanstack/react-query";
import { syncEdgarCompany } from "../../api/edgar/edgar.api";
import { edgarKeys } from "./queryKeys";

export function useSyncEdgarCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticker: string) => syncEdgarCompany(ticker),
    onSuccess: (company) => {
      queryClient.setQueryData(edgarKeys.company(company.ticker), company);
      void queryClient.invalidateQueries({ queryKey: edgarKeys.companies() });
    },
  });
}
