import { Test, TestingModule } from '@nestjs/testing';
import { PricesService } from '../../../../src/modules/prices/service/prices.service';
import {
  YAHOO_FINANCE_CLIENT,
  PRICES_REPOSITORY,
} from '../../../../src/modules/prices/interfaces/prices.interface';

const mockBatchRun = {
  id: 'batch-1',
  startedAt: new Date('2026-01-01T10:00:00Z'),
  finishedAt: new Date('2026-01-01T10:00:05Z'),
  tickerCount: 2,
  errorCount: 0,
  errors: null,
};

const mockRepository = {
  createBatchRun: jest.fn(),
  finishBatchRun: jest.fn(),
  upsertPrice: jest.fn(),
  findPrice: jest.fn(),
  findPricesByTickers: jest.fn(),
  findAllPrices: jest.fn(),
  findLastBatchRun: jest.fn(),
};

const mockYahooClient = {
  fetchPrices: jest.fn(),
};

describe('PricesService', () => {
  let service: PricesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricesService,
        { provide: PRICES_REPOSITORY, useValue: mockRepository },
        { provide: YAHOO_FINANCE_CLIENT, useValue: mockYahooClient },
      ],
    }).compile();

    service = module.get<PricesService>(PricesService);
  });

  describe('runBatch', () => {
    it('should fetch prices, upsert each one and return batch summary', async () => {
      mockRepository.createBatchRun.mockResolvedValue({ id: 'batch-1' });
      mockYahooClient.fetchPrices.mockResolvedValue({
        prices: { AAPL: 200.5, MSFT: 420.0 },
        dailyChangePercentages: { AAPL: 1.25, MSFT: -0.5 },
        errors: {},
      });
      mockRepository.upsertPrice.mockResolvedValue(undefined);
      mockRepository.finishBatchRun.mockResolvedValue({
        ...mockBatchRun,
        tickerCount: 2,
        errorCount: 0,
      });

      const result = await service.runBatch(['AAPL', 'MSFT']);

      expect(mockYahooClient.fetchPrices).toHaveBeenCalledWith([
        'AAPL',
        'MSFT',
      ]);
      expect(mockRepository.upsertPrice).toHaveBeenCalledWith(
        'AAPL',
        200.5,
        1.25,
      );
      expect(mockRepository.upsertPrice).toHaveBeenCalledWith(
        'MSFT',
        420.0,
        -0.5,
      );
      expect(mockRepository.finishBatchRun).toHaveBeenCalledWith(
        'batch-1',
        2,
        0,
        {},
      );
      expect(result.tickerCount).toBe(2);
      expect(result.errorCount).toBe(0);
      expect(result.prices).toEqual({ AAPL: 200.5, MSFT: 420.0 });
      expect(result.dailyChangePercentages).toEqual({
        AAPL: 1.25,
        MSFT: -0.5,
      });
    });

    it('should register errors without interrupting the batch', async () => {
      mockRepository.createBatchRun.mockResolvedValue({ id: 'batch-2' });
      mockYahooClient.fetchPrices.mockResolvedValue({
        prices: { AAPL: 200.5 },
        dailyChangePercentages: { AAPL: null },
        errors: { FAKE: 'No data returned' },
      });
      mockRepository.upsertPrice.mockResolvedValue(undefined);
      mockRepository.finishBatchRun.mockResolvedValue({
        ...mockBatchRun,
        tickerCount: 1,
        errorCount: 1,
      });

      const result = await service.runBatch(['AAPL', 'FAKE']);

      expect(mockRepository.upsertPrice).toHaveBeenCalledTimes(1);
      expect(mockRepository.upsertPrice).toHaveBeenCalledWith(
        'AAPL',
        200.5,
        null,
      );
      expect(mockRepository.finishBatchRun).toHaveBeenCalledWith(
        'batch-2',
        1,
        1,
        { FAKE: 'No data returned' },
      );
      expect(result.errorCount).toBe(1);
      expect(result.errors).toEqual({ FAKE: 'No data returned' });
    });
  });

  describe('getPrice', () => {
    it('should return price for a ticker (uppercased)', async () => {
      const priceRecord = {
        ticker: 'AAPL',
        price: 200.5,
        dailyChangePercent: 1.25,
        updatedAt: new Date(),
      };
      mockRepository.findPrice.mockResolvedValue(priceRecord);

      const result = await service.getPrice('aapl');

      expect(mockRepository.findPrice).toHaveBeenCalledWith('AAPL');
      expect(result).toEqual(priceRecord);
    });

    it('should return null when ticker not in database', async () => {
      mockRepository.findPrice.mockResolvedValue(null);

      const result = await service.getPrice('FAKE');

      expect(result).toBeNull();
    });
  });

  describe('getPricesByTickers', () => {
    it('returns a price map for normalized unique tickers', async () => {
      mockRepository.findPricesByTickers.mockResolvedValue([
        {
          ticker: 'AAPL',
          price: 200.5,
          dailyChangePercent: 1.25,
          updatedAt: new Date(),
        },
      ]);

      const result = await service.getPricesByTickers([
        'aapl',
        ' AAPL ',
        'MSFT',
        '',
      ]);

      expect(mockRepository.findPricesByTickers.mock.calls[0]).toEqual([
        ['AAPL', 'MSFT'],
      ]);
      expect(result).toEqual(
        new Map<string, number | null>([
          ['AAPL', 200.5],
          ['MSFT', null],
        ]),
      );
    });

    it('returns an empty map when no tickers are provided', async () => {
      const result = await service.getPricesByTickers([]);

      expect(mockRepository.findPricesByTickers.mock.calls).toHaveLength(0);
      expect(result).toEqual(new Map());
    });
  });

  describe('getAllPrices', () => {
    it('should return all stored prices', async () => {
      const prices = [
        {
          ticker: 'AAPL',
          price: 200.5,
          dailyChangePercent: 1.25,
          updatedAt: new Date(),
        },
        {
          ticker: 'MSFT',
          price: 420.0,
          dailyChangePercent: -0.5,
          updatedAt: new Date(),
        },
      ];
      mockRepository.findAllPrices.mockResolvedValue(prices);

      const result = await service.getAllPrices();

      expect(result).toEqual(prices);
      expect(result).toHaveLength(2);
    });
  });

  describe('getLastBatchRun', () => {
    it('should return the most recent batch run', async () => {
      mockRepository.findLastBatchRun.mockResolvedValue(mockBatchRun);

      const result = await service.getLastBatchRun();

      expect(mockRepository.findLastBatchRun).toHaveBeenCalled();
      expect(result).toEqual(mockBatchRun);
    });

    it('should return null when no batch has run yet', async () => {
      mockRepository.findLastBatchRun.mockResolvedValue(null);

      const result = await service.getLastBatchRun();

      expect(result).toBeNull();
    });
  });
});
