import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sellTransaction } from "../../api/transactions.api";
import { portfolioKeys } from "../portfolio/queryKeys";
import { transactionKeys } from "./queryKeys";
import type { Transaction, TransactionInput } from "../../types/transactions.types";

export function useSellTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TransactionInput) => sellTransaction(input),
    onSuccess: (transaction) => {
      queryClient.setQueryData<Transaction[]>(
        transactionKeys.list(),
        (transactions = []) => [transaction, ...transactions],
      );
      void queryClient.invalidateQueries({ queryKey: transactionKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: transactionKeys.byTicker(transaction.ticker),
      });
      void queryClient.invalidateQueries({ queryKey: portfolioKeys.detail() });
    },
  });
}
