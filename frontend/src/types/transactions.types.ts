export type TransactionType = "BUY" | "SELL";

export type Transaction = {
  id: string;
  ticker: string;
  type: TransactionType;
  quantity: number;
  price: number;
  date: string;
  createdAt: string;
};

export type TransactionInput = {
  ticker: string;
  quantity: number;
  date: string;
};
