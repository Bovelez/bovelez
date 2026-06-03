import { BadRequestException } from '@nestjs/common';
import { Transaction, TransactionType } from '@prisma/client';
import { IEdgarService } from '../../../../src/modules/edgar/service/edgar.service.interface';
import { PricesService } from '../../../../src/modules/prices/service/prices.service';
import { ITransactionsRepository } from '../../../../src/modules/transactions/repository/transactions.repository.interface';
import { TransactionsService } from '../../../../src/modules/transactions/service/transactions.service';

const USER_ID = 'user-1';

function buildTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    userId: USER_ID,
    ticker: 'AAPL',
    type: TransactionType.BUY,
    quantity: 10,
    price: 200,
    date: new Date('2025-01-15'),
    createdAt: new Date(),
    ...overrides,
  };
}

function todayDate(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function yesterdayDate(): Date {
  const yesterday = todayDate();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return yesterday;
}

function tomorrowDate(): Date {
  const tomorrow = todayDate();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return tomorrow;
}

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionsRepository: jest.Mocked<ITransactionsRepository>;
  let edgarService: jest.Mocked<IEdgarService>;
  let pricesService: jest.Mocked<Pick<PricesService, 'getPrice'>>;

  beforeEach(() => {
    transactionsRepository = {
      createTransaction: jest.fn(),
      getTransactionsByUser: jest.fn(),
      getTransactionsByUserAndTicker: jest.fn(),
      deleteTransactionsByUserAndTicker: jest.fn(),
    };

    edgarService = {
      isValidTicker: jest.fn(),
    } as unknown as jest.Mocked<IEdgarService>;

    pricesService = {
      getPrice: jest.fn(),
    };

    service = new TransactionsService(
      transactionsRepository,
      edgarService,
      pricesService as unknown as PricesService,
    );
  });

  describe('buy', () => {
    const input = {
      ticker: 'AAPL',
      quantity: 10,
      date: todayDate(),
    };

    it('creates a BUY transaction at the stored price', async () => {
      edgarService.isValidTicker.mockResolvedValue(true);
      pricesService.getPrice.mockResolvedValue({
        ticker: 'AAPL',
        price: 200,
        dailyChangePercent: null,
        updatedAt: new Date(),
      });
      transactionsRepository.createTransaction.mockResolvedValue(
        buildTransaction(),
      );

      const result = await service.buy(USER_ID, input);

      expect(transactionsRepository.createTransaction.mock.calls[0]).toEqual([
        USER_ID,
        'AAPL',
        TransactionType.BUY,
        10,
        200,
        input.date,
      ]);
      expect(result.ticker).toBe('AAPL');
      expect(result.type).toBe(TransactionType.BUY);
      expect(result.price).toBe(200);
    });

    it('throws BadRequestException for an invalid ticker', async () => {
      edgarService.isValidTicker.mockResolvedValue(false);

      await expect(service.buy(USER_ID, input)).rejects.toThrow(
        BadRequestException,
      );
      expect(transactionsRepository.createTransaction.mock.calls).toHaveLength(
        0,
      );
    });

    it('throws BadRequestException when no stored price exists', async () => {
      edgarService.isValidTicker.mockResolvedValue(true);
      pricesService.getPrice.mockResolvedValue(null);

      await expect(service.buy(USER_ID, input)).rejects.toThrow(
        BadRequestException,
      );
      expect(transactionsRepository.createTransaction.mock.calls).toHaveLength(
        0,
      );
    });

    it('throws BadRequestException when buying before today', async () => {
      await expect(
        service.buy(USER_ID, { ...input, date: yesterdayDate() }),
      ).rejects.toThrow(BadRequestException);
      expect(edgarService.isValidTicker.mock.calls).toHaveLength(0);
      expect(transactionsRepository.createTransaction.mock.calls).toHaveLength(
        0,
      );
    });

    it('throws BadRequestException when buying after today', async () => {
      await expect(
        service.buy(USER_ID, { ...input, date: tomorrowDate() }),
      ).rejects.toThrow(BadRequestException);
      expect(edgarService.isValidTicker.mock.calls).toHaveLength(0);
      expect(transactionsRepository.createTransaction.mock.calls).toHaveLength(
        0,
      );
    });
  });

  describe('sell', () => {
    const input = { ticker: 'AAPL', quantity: 5, date: todayDate() };

    it('creates a SELL transaction at the stored price', async () => {
      transactionsRepository.getTransactionsByUserAndTicker.mockResolvedValue([
        buildTransaction({ quantity: 10 }),
      ]);
      pricesService.getPrice.mockResolvedValue({
        ticker: 'AAPL',
        price: 250,
        dailyChangePercent: null,
        updatedAt: new Date(),
      });
      transactionsRepository.createTransaction.mockResolvedValue(
        buildTransaction({
          type: TransactionType.SELL,
          quantity: 5,
          price: 250,
        }),
      );

      const result = await service.sell(USER_ID, input);

      expect(transactionsRepository.createTransaction.mock.calls[0]).toEqual([
        USER_ID,
        'AAPL',
        TransactionType.SELL,
        5,
        250,
        input.date,
      ]);
      expect(result.type).toBe(TransactionType.SELL);
      expect(result.price).toBe(250);
      expect(
        transactionsRepository.deleteTransactionsByUserAndTicker.mock.calls,
      ).toHaveLength(0);
    });

    it('throws BadRequestException when no open position exists', async () => {
      transactionsRepository.getTransactionsByUserAndTicker.mockResolvedValue(
        [],
      );

      await expect(service.sell(USER_ID, input)).rejects.toThrow(
        BadRequestException,
      );
      expect(transactionsRepository.createTransaction.mock.calls).toHaveLength(
        0,
      );
    });

    it('throws BadRequestException when selling more than held', async () => {
      transactionsRepository.getTransactionsByUserAndTicker.mockResolvedValue([
        buildTransaction({ quantity: 3 }),
      ]);

      await expect(
        service.sell(USER_ID, { ...input, quantity: 5 }),
      ).rejects.toThrow(BadRequestException);
      expect(transactionsRepository.createTransaction.mock.calls).toHaveLength(
        0,
      );
    });

    it('throws BadRequestException when selling before today', async () => {
      await expect(
        service.sell(USER_ID, { ...input, date: yesterdayDate() }),
      ).rejects.toThrow(BadRequestException);
      expect(
        transactionsRepository.getTransactionsByUserAndTicker.mock.calls,
      ).toHaveLength(0);
      expect(transactionsRepository.createTransaction.mock.calls).toHaveLength(
        0,
      );
    });

    it('throws BadRequestException when selling after today', async () => {
      await expect(
        service.sell(USER_ID, { ...input, date: tomorrowDate() }),
      ).rejects.toThrow(BadRequestException);
      expect(
        transactionsRepository.getTransactionsByUserAndTicker.mock.calls,
      ).toHaveLength(0);
      expect(transactionsRepository.createTransaction.mock.calls).toHaveLength(
        0,
      );
    });

    it('throws BadRequestException when no stored price exists', async () => {
      transactionsRepository.getTransactionsByUserAndTicker.mockResolvedValue([
        buildTransaction({ quantity: 10 }),
      ]);
      pricesService.getPrice.mockResolvedValue(null);

      await expect(service.sell(USER_ID, input)).rejects.toThrow(
        BadRequestException,
      );
      expect(transactionsRepository.createTransaction.mock.calls).toHaveLength(
        0,
      );
    });

    it('deletes all ticker transactions when selling the full position', async () => {
      transactionsRepository.getTransactionsByUserAndTicker.mockResolvedValue([
        buildTransaction({ quantity: 10 }),
      ]);
      pricesService.getPrice.mockResolvedValue({
        ticker: 'AAPL',
        price: 250,
        dailyChangePercent: null,
        updatedAt: new Date(),
      });
      transactionsRepository.createTransaction.mockResolvedValue(
        buildTransaction({
          type: TransactionType.SELL,
          quantity: 10,
          price: 250,
        }),
      );

      await service.sell(USER_ID, { ...input, quantity: 10 });

      expect(
        transactionsRepository.deleteTransactionsByUserAndTicker.mock.calls[0],
      ).toEqual([USER_ID, 'AAPL']);
    });
  });

  describe('getOpenPositions', () => {
    it('groups transactions by ticker and returns only open positions', async () => {
      transactionsRepository.getTransactionsByUser.mockResolvedValue([
        buildTransaction({
          id: 'aapl-buy',
          ticker: 'AAPL',
          quantity: 10,
          price: 200,
        }),
        buildTransaction({
          id: 'aapl-sell',
          ticker: 'AAPL',
          type: TransactionType.SELL,
          quantity: 10,
          price: 250,
        }),
        buildTransaction({
          id: 'msft-buy',
          ticker: 'MSFT',
          quantity: 5,
          price: 300,
        }),
      ]);

      const positions = await service.getOpenPositions(USER_ID);

      expect(positions).toEqual([
        { ticker: 'MSFT', quantity: 5, avgCost: 300 },
      ]);
    });

    it('keeps weighted average cost after partial sells', async () => {
      transactionsRepository.getTransactionsByUser.mockResolvedValue([
        buildTransaction({ id: 'buy-1', quantity: 10, price: 200 }),
        buildTransaction({
          id: 'buy-2',
          quantity: 10,
          price: 300,
          date: new Date('2025-02-01'),
        }),
        buildTransaction({
          id: 'sell-1',
          type: TransactionType.SELL,
          quantity: 5,
          price: 350,
          date: new Date('2025-03-01'),
        }),
      ]);

      const positions = await service.getOpenPositions(USER_ID);

      expect(positions).toEqual([
        { ticker: 'AAPL', quantity: 15, avgCost: 250 },
      ]);
    });
  });

  describe('getTransactionsByUserId', () => {
    it('returns all transactions for the user mapped to DTOs', async () => {
      transactionsRepository.getTransactionsByUser.mockResolvedValue([
        buildTransaction({ id: 'tx-1', ticker: 'AAPL' }),
        buildTransaction({ id: 'tx-2', ticker: 'MSFT', price: 300 }),
      ]);

      const result = await service.getTransactionsByUserId(USER_ID);

      expect(
        transactionsRepository.getTransactionsByUser.mock.calls[0],
      ).toEqual([USER_ID]);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 'tx-1', ticker: 'AAPL' });
      expect(result[1]).toMatchObject({ id: 'tx-2', ticker: 'MSFT' });
    });

    it('returns an empty array when the user has no transactions', async () => {
      transactionsRepository.getTransactionsByUser.mockResolvedValue([]);

      const result = await service.getTransactionsByUserId(USER_ID);

      expect(result).toEqual([]);
    });
  });

  describe('getTransactionsByTicker', () => {
    it('returns ticker transactions scoped to the user and normalizes ticker casing', async () => {
      transactionsRepository.getTransactionsByUserAndTicker.mockResolvedValue([
        buildTransaction({ id: 'aapl-buy', ticker: 'AAPL' }),
      ]);

      const transactions = await service.getTransactionsByTicker(
        USER_ID,
        ' aapl ',
      );

      expect(
        transactionsRepository.getTransactionsByUserAndTicker.mock.calls[0],
      ).toEqual([USER_ID, 'AAPL']);
      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toMatchObject({
        id: 'aapl-buy',
        ticker: 'AAPL',
        type: TransactionType.BUY,
      });
    });
  });
});
