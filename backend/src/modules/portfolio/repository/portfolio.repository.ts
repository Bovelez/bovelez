import { Injectable } from '@nestjs/common';
import { Transaction, TransactionType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { IPortfolioRepository } from './portfolio.repository.interface';
import { IPosition } from '../input/position.interface';

@Injectable()
export class PortfolioRepository implements IPortfolioRepository {
  constructor(private readonly prisma: PrismaService) {}

  createTransaction(
    userId: string,
    ticker: string,
    type: TransactionType,
    quantity: number,
    price: number,
    date: Date,
  ): Promise<Transaction> {
    return this.prisma.transaction.create({
      data: { userId, ticker, type, quantity, price, date },
    });
  }

  async getAggregatedPositions(userId: string): Promise<IPosition[]> {
    const tickers = await this.prisma.transaction.findMany({
      where: { userId },
      select: { ticker: true },
      distinct: ['ticker'],
    });

    const results: IPosition[] = [];
    for (const { ticker } of tickers) {
      const position = await this.getAggregatedPosition(userId, ticker);
      if (position && position.quantity > 0) {
        results.push(position);
      }
    }
    return results;
  }

  async getAggregatedPosition(
    userId: string,
    ticker: string,
  ): Promise<IPosition | null> {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId, ticker },
      orderBy: { date: 'asc' },
    });

    if (transactions.length === 0) return null;

    // Walk transactions chronologically, tracking running balance.
    // When balance hits 0, reset the cost basis window so that only
    // BUYs from the current open position contribute to avgCost.
    let runningQty = 0;
    let windowBuys: { quantity: number; price: number }[] = [];

    for (const tx of transactions) {
      if (tx.type === TransactionType.BUY) {
        runningQty += tx.quantity;
        windowBuys.push({ quantity: tx.quantity, price: tx.price });
      } else {
        runningQty -= tx.quantity;
        if (runningQty <= 0) {
          // Position fully closed (or over-sold due to data issues): reset window
          runningQty = 0;
          windowBuys = [];
        }
      }
    }

    if (runningQty === 0) return null;

    const totalCost = windowBuys.reduce(
      (sum, b) => sum + b.price * b.quantity,
      0,
    );
    const totalBought = windowBuys.reduce((sum, b) => sum + b.quantity, 0);
    const avgCost = totalBought > 0 ? totalCost / totalBought : 0;

    return { ticker, quantity: runningQty, avgCost };
  }
}
