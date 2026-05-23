import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateStockPrices } from "../../api/prices.api";
import { portfolioKeys } from "../portfolio/queryKeys";
import type { UpdatePricesInput } from "../../types/prices.types";
import { priceKeys } from "./queryKeys";

export function useUpdateStockPrices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdatePricesInput) => updateStockPrices(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: priceKeys.all });
      void queryClient.invalidateQueries({ queryKey: portfolioKeys.detail() });
    },
  });
}
