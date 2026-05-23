import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sellTransaction } from "../../api/transactions/transactions.api";
import { transactionKeys } from "./queryKeys";
import type { TransactionInput } from "../../types/transactions.types";

export function useSellTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TransactionInput) => sellTransaction(input),
    onSuccess: (transaction) => {
      void queryClient.invalidateQueries({
        queryKey: transactionKeys.byTicker(transaction.ticker),
      });
    },
  });
}
