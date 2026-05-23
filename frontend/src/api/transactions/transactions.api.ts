import apiClient from "../apiClient";
import type { Transaction, TransactionInput } from "../../types/transactions.types";

export async function buyTransaction(
  input: TransactionInput,
): Promise<Transaction> {
  const { data } = await apiClient.post<Transaction>("/transactions/buy", input);
  return data;
}

export async function sellTransaction(
  input: TransactionInput,
): Promise<Transaction> {
  const { data } = await apiClient.post<Transaction>("/transactions/sell", input);
  return data;
}

export async function getTickerTransactions(
  ticker: string,
): Promise<Transaction[]> {
  const { data } = await apiClient.get<Transaction[]>(
    `/transactions/${encodeURIComponent(ticker)}`,
  );
  return data;
}
