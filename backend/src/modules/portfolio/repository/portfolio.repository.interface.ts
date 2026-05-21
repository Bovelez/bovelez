import { Transaction, TransactionType } from '@prisma/client';
import { IPosition } from '../input/position.interface';

export type { IPosition };

export interface IPortfolioRepository {
  createTransaction(
    userId: string,
    ticker: string,
    type: TransactionType,
    quantity: number,
    price: number,
    date: Date,
  ): Promise<Transaction>;

  getAggregatedPositions(userId: string): Promise<IPosition[]>;
  getAggregatedPosition(userId: string, ticker: string): Promise<IPosition | null>;
}
