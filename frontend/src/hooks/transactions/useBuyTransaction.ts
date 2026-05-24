import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buyTransaction } from "../../api/transactions.api";
import { portfolioKeys } from "../portfolio/queryKeys";
import { transactionKeys } from "./queryKeys";
import type { TransactionInput } from "../../types/transactions.types";

export function useBuyTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TransactionInput) => buyTransaction(input),
    onSuccess: (transaction) => {
      void queryClient.invalidateQueries({
        queryKey: transactionKeys.byTicker(transaction.ticker),
      });
      void queryClient.invalidateQueries({ queryKey: portfolioKeys.detail() });
    },
  });
}
