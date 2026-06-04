import { Transaction, TransactionType } from '@prisma/client';

export interface ITransactionsRepository {
  createTransaction(
    userId: string,
    ticker: string,
    type: TransactionType,
    quantity: number,
    price: number,
    date: Date,
  ): Promise<Transaction>;

  getTransactionsByUser(userId: string): Promise<Transaction[]>;
  getTransactionsByUserAndTicker(
    userId: string,
    ticker: string,
  ): Promise<Transaction[]>;
}
