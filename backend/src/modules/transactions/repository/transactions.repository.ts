import { Injectable } from '@nestjs/common';
import { Transaction, TransactionType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ITransactionsRepository } from './transactions.repository.interface';

@Injectable()
export class TransactionsRepository implements ITransactionsRepository {
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

  getTransactionsByUser(userId: string): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: [{ ticker: 'asc' }, { date: 'asc' }, { createdAt: 'asc' }],
    });
  }

  getTransactionsByUserAndTicker(
    userId: string,
    ticker: string,
  ): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: { userId, ticker },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });
  }
}
