import { useQuery } from "@tanstack/react-query";
import { getEdgarCompanyFilings } from "../../api/edgar.api";
import { edgarKeys } from "./queryKeys";

export function useEdgarCompanyFilings(ticker: string | null) {
  return useQuery({
    queryKey: edgarKeys.filings(ticker ?? ""),
    queryFn: () => getEdgarCompanyFilings(ticker ?? ""),
    enabled: Boolean(ticker),
  });
}
