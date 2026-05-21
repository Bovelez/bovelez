import { BadRequestException } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PortfolioService } from '../../../../src/modules/portfolio/service/portfolio.service';
import { IPortfolioRepository } from '../../../../src/modules/portfolio/repository/portfolio.repository.interface';
import { IEdgarService } from '../../../../src/modules/edgar/service/edgar.service.interface';
import { PricesService } from '../../../../src/modules/prices/service/prices.service';
import { Transaction } from '@prisma/client';

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

describe('PortfolioService', () => {
  let service: PortfolioService;
  let portfolioRepository: jest.Mocked<IPortfolioRepository>;
  let edgarService: jest.Mocked<IEdgarService>;
  let pricesService: jest.Mocked<Pick<PricesService, 'getPrice' | 'getLastBatchRun'>>;

  beforeEach(() => {
    portfolioRepository = {
      createTransaction: jest.fn(),
      getAggregatedPositions: jest.fn(),
      getAggregatedPosition: jest.fn(),
    };

    edgarService = {
      isValidTicker: jest.fn(),
    } as unknown as jest.Mocked<IEdgarService>;

    pricesService = {
      getPrice: jest.fn(),
      getLastBatchRun: jest.fn(),
    };

    service = new PortfolioService(
      portfolioRepository,
      edgarService,
      pricesService as unknown as PricesService,
    );
  });

  describe('buy', () => {
    const input = { ticker: 'AAPL', quantity: 10, date: new Date('2025-01-15') };

    it('creates a BUY transaction at the stored price', async () => {
      edgarService.isValidTicker.mockResolvedValue(true);
      pricesService.getPrice.mockResolvedValue({ ticker: 'AAPL', price: 200, updatedAt: new Date() });
      portfolioRepository.createTransaction.mockResolvedValue(buildTransaction());

      const result = await service.buy(USER_ID, input);

      expect(portfolioRepository.createTransaction).toHaveBeenCalledWith(
        USER_ID, 'AAPL', TransactionType.BUY, 10, 200, input.date,
      );
      expect(result.ticker).toBe('AAPL');
      expect(result.type).toBe(TransactionType.BUY);
      expect(result.price).toBe(200);
    });

    it('throws BadRequestException for an invalid ticker', async () => {
      edgarService.isValidTicker.mockResolvedValue(false);

      await expect(service.buy(USER_ID, input)).rejects.toThrow(BadRequestException);
      expect(portfolioRepository.createTransaction).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when no stored price exists', async () => {
      edgarService.isValidTicker.mockResolvedValue(true);
      pricesService.getPrice.mockResolvedValue(null);

      await expect(service.buy(USER_ID, input)).rejects.toThrow(BadRequestException);
      expect(portfolioRepository.createTransaction).not.toHaveBeenCalled();
    });
  });

  describe('sell', () => {
    const input = { ticker: 'AAPL', quantity: 5, date: new Date('2025-06-01') };

    it('creates a SELL transaction at the stored price', async () => {
      portfolioRepository.getAggregatedPosition.mockResolvedValue({ ticker: 'AAPL', quantity: 10, avgCost: 200 });
      pricesService.getPrice.mockResolvedValue({ ticker: 'AAPL', price: 250, updatedAt: new Date() });
      portfolioRepository.createTransaction.mockResolvedValue(buildTransaction({ type: TransactionType.SELL, quantity: 5, price: 250 }));

      const result = await service.sell(USER_ID, input);

      expect(portfolioRepository.createTransaction).toHaveBeenCalledWith(
        USER_ID, 'AAPL', TransactionType.SELL, 5, 250, input.date,
      );
      expect(result.type).toBe(TransactionType.SELL);
      expect(result.price).toBe(250);
    });

    it('throws BadRequestException when no open position exists', async () => {
      portfolioRepository.getAggregatedPosition.mockResolvedValue(null);

      await expect(service.sell(USER_ID, input)).rejects.toThrow(BadRequestException);
      expect(portfolioRepository.createTransaction).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when selling more than held', async () => {
      portfolioRepository.getAggregatedPosition.mockResolvedValue({ ticker: 'AAPL', quantity: 3, avgCost: 200 });

      await expect(service.sell(USER_ID, { ...input, quantity: 5 })).rejects.toThrow(BadRequestException);
      expect(portfolioRepository.createTransaction).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when no stored price exists', async () => {
      portfolioRepository.getAggregatedPosition.mockResolvedValue({ ticker: 'AAPL', quantity: 10, avgCost: 200 });
      pricesService.getPrice.mockResolvedValue(null);

      await expect(service.sell(USER_ID, input)).rejects.toThrow(BadRequestException);
      expect(portfolioRepository.createTransaction).not.toHaveBeenCalled();
    });
  });

  describe('getPortfolio', () => {
    it('returns positions enriched with current price and P&L', async () => {
      portfolioRepository.getAggregatedPositions.mockResolvedValue([
        { ticker: 'AAPL', quantity: 10, avgCost: 200 },
      ]);
      pricesService.getLastBatchRun.mockResolvedValue({ id: 'run-1', startedAt: new Date(), finishedAt: new Date(), tickerCount: 1, errorCount: 0, errors: null });
      pricesService.getPrice.mockResolvedValue({ ticker: 'AAPL', price: 250, updatedAt: new Date() });

      const portfolio = await service.getPortfolio(USER_ID);

      expect(portfolio.positions).toHaveLength(1);
      const pos = portfolio.positions[0];
      expect(pos.ticker).toBe('AAPL');
      expect(pos.currentPrice).toBe(250);
      expect(pos.pnl).toBe((250 - 200) * 10);
      expect(pos.hasPrice).toBe(true);
    });

    it('returns positions with null P&L when no price is stored', async () => {
      portfolioRepository.getAggregatedPositions.mockResolvedValue([
        { ticker: 'MSFT', quantity: 5, avgCost: 300 },
      ]);
      pricesService.getLastBatchRun.mockResolvedValue(null);
      pricesService.getPrice.mockResolvedValue(null);

      const portfolio = await service.getPortfolio(USER_ID);

      const pos = portfolio.positions[0];
      expect(pos.currentPrice).toBeNull();
      expect(pos.pnl).toBeNull();
      expect(pos.hasPrice).toBe(false);
      expect(portfolio.lastPriceUpdate).toBeNull();
    });

    it('sums totalValue from all positions with prices', async () => {
      portfolioRepository.getAggregatedPositions.mockResolvedValue([
        { ticker: 'AAPL', quantity: 10, avgCost: 200 },
        { ticker: 'MSFT', quantity: 5, avgCost: 300 },
      ]);
      pricesService.getLastBatchRun.mockResolvedValue(null);
      pricesService.getPrice
        .mockResolvedValueOnce({ ticker: 'AAPL', price: 250, updatedAt: new Date() })
        .mockResolvedValueOnce({ ticker: 'MSFT', price: 400, updatedAt: new Date() });

      const portfolio = await service.getPortfolio(USER_ID);

      expect(portfolio.totalValue).toBe(10 * 250 + 5 * 400);
    });
  });
});
