import { useQuery } from "@tanstack/react-query";
import { getEdgarCompany } from "../../api/edgar/edgar.api";
import { edgarKeys } from "./queryKeys";

export function useEdgarCompany(ticker: string | null) {
  return useQuery({
    queryKey: edgarKeys.company(ticker ?? ""),
    queryFn: () => getEdgarCompany(ticker ?? ""),
    enabled: Boolean(ticker),
  });
}
