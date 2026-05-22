import { Transaction, TransactionType } from '@prisma/client';

export class TransactionDto {
  id: string;
  ticker: string;
  type: TransactionType;
  quantity: number;
  price: number;
  date: Date;
  createdAt: Date;

  constructor(tx: Transaction) {
    this.id = tx.id;
    this.ticker = tx.ticker;
    this.type = tx.type;
    this.quantity = tx.quantity;
    this.price = tx.price;
    this.date = tx.date;
    this.createdAt = tx.createdAt;
  }
}
