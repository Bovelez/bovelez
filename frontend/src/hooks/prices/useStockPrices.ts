import { useQuery } from "@tanstack/react-query";
import { getStockPrices } from "../../api/prices/prices.api";
import { priceKeys } from "./queryKeys";

export function useStockPrices() {
  return useQuery({
    queryKey: priceKeys.list(),
    queryFn: getStockPrices,
  });
}
