import { useQuery } from "@tanstack/react-query";
import { getStockPrice } from "../../api/prices.api";
import { priceKeys } from "./queryKeys";

export function useStockPrice(ticker: string | null) {
  return useQuery({
    queryKey: priceKeys.detail(ticker ?? ""),
    queryFn: () => getStockPrice(ticker ?? ""),
    enabled: Boolean(ticker),
  });
}
