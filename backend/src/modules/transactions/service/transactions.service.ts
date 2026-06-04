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
    this.validateTransactionDate(input.date);
    await this.validateTicker(input.ticker);
    const price = await this.getLatestPriceOrThrow(input.ticker);
    const transaction = await this.executeBuyTransaction(userId, input, price);
    return new TransactionDto(transaction);
  }

  async sell(
    userId: string,
    input: SellTransactionInput,
  ): Promise<TransactionDto> {
    this.validateTransactionDate(input.date);
    const price = await this.getLatestPriceOrThrow(input.ticker);
    await this.validatePosition(userId, input);
    const transaction = await this.executeSellTransaction(userId, input, price);
    return new TransactionDto(transaction);
  }

  async getOpenPositions(userId: string): Promise<IPosition[]> {
    const transactions =
      await this.transactionsRepository.getTransactionsByUser(userId);
    return this.buildPositionsByTicker(transactions);
  }

  private async getOpenPosition(
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
    return this.buildActiveTransactionsFromTransactions(tickerTransactions).map(
      (transaction) => new TransactionDto(transaction),
    );
  }

  async getTransactionsByUserId(userId: string): Promise<TransactionDto[]> {
    const tickerTransactions =
      await this.transactionsRepository.getTransactionsByUser(userId);
    return tickerTransactions.map(
      (transaction) => new TransactionDto(transaction),
    );
  }

  private async validateTicker(ticker: string): Promise<void> {
    const isValid = await this.edgarService.isValidTicker(ticker);
    if (!isValid) {
      throw new BadRequestException('Ticker no válido');
    }
  }

  private validateTransactionDate(date: Date): void {
    if (
      this.getUniversalDateOnlyTime(date) !==
      this.getUniversalDateOnlyTime(new Date())
    ) {
      throw new BadRequestException(
        'Solo podés registrar operaciones con fecha de hoy',
      );
    }
  }

  private async getLatestPriceOrThrow(ticker: string): Promise<number> {
    const priceRecord = await this.pricesService.getPrice(ticker);
    if (!priceRecord) {
      throw new BadRequestException(
        `No hay precio registrado para ${ticker}. Ejecutá el batch de precios primero.`,
      );
    }
    return priceRecord.price;
  }

  private async executeBuyTransaction(
    userId: string,
    input: BuyTransactionInput,
    price: number,
  ): Promise<Transaction> {
    return this.transactionsRepository.createTransaction(
      userId,
      input.ticker,
      TransactionType.BUY,
      input.quantity,
      price,
      input.date,
    );
  }
  private async validatePosition(
    userId: string,
    input: SellTransactionInput,
  ): Promise<void> {
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
  }

  private async executeSellTransaction(
    userId: string,
    input: SellTransactionInput,
    price: number,
  ): Promise<Transaction> {
    return this.transactionsRepository.createTransaction(
      userId,
      input.ticker,
      TransactionType.SELL,
      input.quantity,
      price,
      input.date,
    );
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
    const sortedTransactions =
      this.sortTransactionsChronologically(transactions);
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

  private buildActiveTransactionsFromTransactions(
    transactions: Transaction[],
  ): Transaction[] {
    const sortedTransactions =
      this.sortTransactionsChronologically(transactions);
    const activeTransactions: Transaction[] = [];
    let quantity = 0;

    for (const transaction of sortedTransactions) {
      if (transaction.type === TransactionType.BUY) {
        quantity += transaction.quantity;
        activeTransactions.push(transaction);
        continue;
      }

      if (quantity === 0) {
        continue;
      }

      const quantityToSell = Math.min(transaction.quantity, quantity);
      quantity -= quantityToSell;
      activeTransactions.push(transaction);

      if (this.isZeroQuantity(quantity)) {
        quantity = 0;
        activeTransactions.length = 0;
      }
    }

    return activeTransactions;
  }

  private sortTransactionsChronologically(
    transactions: Transaction[],
  ): Transaction[] {
    return [...transactions].sort((a, b) => {
      const dateDiff = a.date.getTime() - b.date.getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  private isZeroQuantity(quantity: number): boolean {
    return Math.abs(quantity) < TransactionsService.ZERO_QUANTITY_THRESHOLD;
  }

  private getUniversalDateOnlyTime(date: Date): number {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    ).getTime();
  }
}
