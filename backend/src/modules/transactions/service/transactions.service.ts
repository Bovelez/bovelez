import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Transaction, TransactionType } from '@prisma/client';
import type { IEdgarService } from '../../edgar/service/edgar.service.interface';
import { PricesService } from '../../prices/service/prices.service';
import { TransactionDto } from '../dto/transaction.dto';
import type { BuyTransactionInput } from '../input/buy-transaction.input';
import type { SellTransactionInput } from '../input/sell-transaction.input';
import { IPosition } from '../interfaces/position.interface';
import type { ITransactionsRepository } from '../repository/transactions.repository.interface';

@Injectable()
export class TransactionsService {
  private static readonly ZERO_QUANTITY_THRESHOLD = 1e-9;

  constructor(
    @Inject('TransactionsRepository')
    private readonly transactionsRepository: ITransactionsRepository,
    @Inject('EdgarService')
    private readonly edgarService: IEdgarService,
    private readonly pricesService: PricesService,
  ) {}

  async buy(
    userId: string,
    input: BuyTransactionInput,
  ): Promise<TransactionDto> {
    const valid = await this.edgarService.isValidTicker(input.ticker);
    if (!valid) {
      throw new BadRequestException('Ticker no válido');
    }

    const priceRecord = await this.pricesService.getPrice(input.ticker);
    if (!priceRecord) {
      throw new BadRequestException(
        `No hay precio registrado para ${input.ticker}. Ejecutá el batch de precios primero.`,
      );
    }

    const tx = await this.transactionsRepository.createTransaction(
      userId,
      input.ticker,
      TransactionType.BUY,
      input.quantity,
      priceRecord.price,
      input.date,
    );

    return new TransactionDto(tx);
  }

  async sell(
    userId: string,
    input: SellTransactionInput,
  ): Promise<TransactionDto> {
    const position = await this.getOpenPosition(userId, input.ticker);

    if (!position) {
      throw new BadRequestException(
        `No tenés posición abierta en ${input.ticker}`,
      );
    }

    if (input.quantity > position.quantity) {
      throw new BadRequestException(
        `Querés vender ${input.quantity} acciones pero solo tenés ${position.quantity}`,
      );
    }

    const priceRecord = await this.pricesService.getPrice(input.ticker);
    if (!priceRecord) {
      throw new BadRequestException(
        `No hay precio registrado para ${input.ticker}. Ejecutá el batch de precios primero.`,
      );
    }

    const tx = await this.transactionsRepository.createTransaction(
      userId,
      input.ticker,
      TransactionType.SELL,
      input.quantity,
      priceRecord.price,
      input.date,
    );

    const remainingQuantity = position.quantity - input.quantity;
    if (this.isZeroQuantity(remainingQuantity)) {
      await this.transactionsRepository.deleteTransactionsByUserAndTicker(
        userId,
        input.ticker,
      );
    }

    return new TransactionDto(tx);
  }

  async getOpenPositions(userId: string): Promise<IPosition[]> {
    const transactions =
      await this.transactionsRepository.getTransactionsByUser(userId);
    return this.buildPositionsByTicker(transactions);
  }

  async getOpenPosition(
    userId: string,
    ticker: string,
  ): Promise<IPosition | null> {
    const transactions =
      await this.transactionsRepository.getTransactionsByUserAndTicker(
        userId,
        ticker,
      );
    return this.buildPositionFromTransactions(ticker, transactions);
  }

  async getTransactionsByTicker(
    userId: string,
    ticker: string,
  ): Promise<TransactionDto[]> {
    const normalizedTicker = ticker.trim().toUpperCase();
    const tickerTransactions =
      await this.transactionsRepository.getTransactionsByUserAndTicker(
        userId,
        normalizedTicker,
      );
    return tickerTransactions.map((tx) => new TransactionDto(tx));
  }

  private buildPositionsByTicker(transactions: Transaction[]): IPosition[] {
    const transactionsByTicker = new Map<string, Transaction[]>();

    for (const transaction of transactions) {
      const tickerTransactions =
        transactionsByTicker.get(transaction.ticker) ?? [];
      tickerTransactions.push(transaction);
      transactionsByTicker.set(transaction.ticker, tickerTransactions);
    }

    return Array.from(transactionsByTicker.entries()).flatMap(
      ([ticker, tickerTransactions]) => {
        const position = this.buildPositionFromTransactions(
          ticker,
          tickerTransactions,
        );
        return position ? [position] : [];
      },
    );
  }

  private buildPositionFromTransactions(
    ticker: string,
    transactions: Transaction[],
  ): IPosition | null {
    const sortedTransactions = [...transactions].sort((a, b) => {
      const dateDiff = a.date.getTime() - b.date.getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    let quantity = 0;
    let totalCost = 0;

    for (const transaction of sortedTransactions) {
      if (transaction.type === TransactionType.BUY) {
        quantity += transaction.quantity;
        totalCost += transaction.quantity * transaction.price;
        continue;
      }

      if (quantity === 0) {
        continue;
      }

      const quantityToSell = Math.min(transaction.quantity, quantity);
      const avgCost = totalCost / quantity;
      quantity -= quantityToSell;
      totalCost -= avgCost * quantityToSell;

      if (this.isZeroQuantity(quantity)) {
        quantity = 0;
        totalCost = 0;
      }
    }

    if (this.isZeroQuantity(quantity)) {
      return null;
    }

    return {
      ticker,
      quantity,
      avgCost: totalCost / quantity,
    };
  }

  private isZeroQuantity(quantity: number): boolean {
    return Math.abs(quantity) < TransactionsService.ZERO_QUANTITY_THRESHOLD;
  }
}
