import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { IWatchlistRepository } from '../../../../src/modules/watchlist/repository/watchlist.repository.interface';
import { IEdgarService } from '../../../../src/modules/edgar/service/edgar.service.interface';
import {
  WatchlistService,
  MAX_WATCHLIST_SIZE,
} from '../../../../src/modules/watchlist/service/watchlist.service';
import { IWatchlistItem } from '../../../../src/modules/watchlist/interfaces/watchlist.interface';
import { PricesService } from '../../../../src/modules/prices/service/prices.service';

const USER_ID = 'user-1';

function buildItem(overrides: Partial<IWatchlistItem> = {}): IWatchlistItem {
  return {
    id: 'item-1',
    userId: USER_ID,
    ticker: 'AAPL',
    createdAt: new Date(),
    ...overrides,
  };
}

function buildMetrics(ticker: string) {
  return {
    cik: '000001',
    name: ticker,
    metrics: {
      revenue: [],
      netIncome: [],
      eps: [],
      totalAssets: [],
      totalLiabilities: [],
    },
  };
}

describe('WatchlistService', () => {
  let service: WatchlistService;
  let repository: jest.Mocked<IWatchlistRepository>;
  let edgarService: jest.Mocked<IEdgarService>;
  let pricesService: jest.Mocked<PricesService>;

  beforeEach(() => {
    repository = {
      add: jest.fn(),
      remove: jest.fn(),
      findByUser: jest.fn(),
      findOne: jest.fn(),
      countByUser: jest.fn(),
    };

    edgarService = {
      isValidTicker: jest.fn(),
      syncCompany: jest.fn(),
      getCompany: jest.fn(),
      getAllCompanies: jest.fn(),
      searchCompanies: jest.fn(),
      getFilings: jest.fn(),
      getMetrics: jest.fn(),
    };

    pricesService = {
      getPricesByTickersWithChange: jest.fn(),
    } as unknown as jest.Mocked<PricesService>;

    pricesService.getPricesByTickersWithChange.mockResolvedValue(new Map());

    service = new WatchlistService(repository, edgarService, pricesService);
  });

  // ── addItem ────────────────────────────────────────────────────────────────

  describe('addItem', () => {
    beforeEach(() => {
      repository.countByUser.mockResolvedValue(0);
      repository.findOne.mockResolvedValue(null);
      edgarService.isValidTicker.mockResolvedValue(true);
      repository.add.mockResolvedValue(buildItem());
    });

    it('persists and returns the new watchlist item', async () => {
      const result = await service.addItem(USER_ID, 'AAPL');

      expect(repository.add.mock.calls[0]).toEqual([USER_ID, 'AAPL']);
      expect(result.ticker).toBe('AAPL');
    });

    it('normalizes the ticker to uppercase before persisting', async () => {
      await service.addItem(USER_ID, 'aapl');

      expect(repository.add.mock.calls[0][1]).toBe('AAPL');
      expect(edgarService.isValidTicker.mock.calls[0][0]).toBe('AAPL');
    });

    it('throws ConflictException when the ticker is already in the watchlist', async () => {
      repository.findOne.mockResolvedValue(buildItem());

      await expect(service.addItem(USER_ID, 'AAPL')).rejects.toThrow(
        ConflictException,
      );
      expect(repository.add.mock.calls).toHaveLength(0);
    });

    it('throws NotFoundException when the ticker does not exist in EDGAR', async () => {
      edgarService.isValidTicker.mockResolvedValue(false);

      await expect(service.addItem(USER_ID, 'FAKE')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.add.mock.calls).toHaveLength(0);
    });

    it('throws UnprocessableEntityException when the watchlist is at max capacity', async () => {
      repository.countByUser.mockResolvedValue(MAX_WATCHLIST_SIZE);

      await expect(service.addItem(USER_ID, 'AAPL')).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(edgarService.isValidTicker.mock.calls).toHaveLength(0);
      expect(repository.add.mock.calls).toHaveLength(0);
    });

    it('checks capacity before validating ticker to avoid unnecessary EDGAR calls', async () => {
      repository.countByUser.mockResolvedValue(MAX_WATCHLIST_SIZE);

      await expect(service.addItem(USER_ID, 'AAPL')).rejects.toThrow(
        UnprocessableEntityException,
      );

      expect(edgarService.isValidTicker.mock.calls).toHaveLength(0);
    });
  });

  // ── removeItem ─────────────────────────────────────────────────────────────

  describe('removeItem', () => {
    beforeEach(() => {
      repository.findOne.mockResolvedValue(buildItem());
      repository.remove.mockResolvedValue(undefined);
    });

    it('removes the item when it belongs to the user', async () => {
      await service.removeItem(USER_ID, 'AAPL');

      expect(repository.remove.mock.calls[0]).toEqual([USER_ID, 'AAPL']);
    });

    it('normalizes ticker to uppercase before removing', async () => {
      await service.removeItem(USER_ID, 'aapl');

      expect(repository.remove.mock.calls[0][1]).toBe('AAPL');
    });

    it('throws NotFoundException when the ticker is not in the watchlist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.removeItem(USER_ID, 'MSFT')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.remove.mock.calls).toHaveLength(0);
    });
  });

  // ── getItems ───────────────────────────────────────────────────────────────

  describe('getItems', () => {
    it('returns an empty array when the watchlist is empty', async () => {
      repository.findByUser.mockResolvedValue([]);

      const result = await service.getItems(USER_ID);

      expect(result).toEqual([]);
    });

    it('returns items enriched with company name when available', async () => {
      repository.findByUser.mockResolvedValue([buildItem({ ticker: 'AAPL' })]);
      edgarService.getCompany.mockResolvedValue({
        id: 'company-1',
        cik: '320193',
        ticker: 'AAPL',
        name: 'Apple Inc.',
        updatedAt: new Date(),
      });
      pricesService.getPricesByTickersWithChange.mockResolvedValue(new Map());

      const result = await service.getItems(USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0].ticker).toBe('AAPL');
      expect(result[0].name).toBe('Apple Inc.');
    });

    it('returns name as null when the company is not found', async () => {
      repository.findByUser.mockResolvedValue([buildItem({ ticker: 'AAPL' })]);
      edgarService.getCompany.mockRejectedValue(new NotFoundException());
      pricesService.getPricesByTickersWithChange.mockResolvedValue(new Map());

      const result = await service.getItems(USER_ID);

      expect(result[0].name).toBeNull();
    });

    it('still returns other items when one enrichment fails', async () => {
      repository.findByUser.mockResolvedValue([
        buildItem({ id: 'item-1', ticker: 'AAPL' }),
        buildItem({ id: 'item-2', ticker: 'MSFT' }),
      ]);
      edgarService.getCompany
        .mockRejectedValueOnce(new Error('not found'))
        .mockResolvedValueOnce({
          id: 'company-2',
          cik: '789019',
          ticker: 'MSFT',
          name: 'Microsoft Corporation',
          updatedAt: new Date(),
        });
      pricesService.getPricesByTickersWithChange.mockResolvedValue(new Map());

      const result = await service.getItems(USER_ID);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBeNull();
      expect(result[1].name).toBe('Microsoft Corporation');
    });

    it('enriches items with price and daily change when available', async () => {
      const updatedAt = new Date('2025-01-15T10:30:00Z');
      repository.findByUser.mockResolvedValue([buildItem({ ticker: 'AAPL' })]);
      edgarService.getCompany.mockResolvedValue({
        id: 'company-1',
        cik: '320193',
        ticker: 'AAPL',
        name: 'Apple Inc.',
        updatedAt: new Date(),
      });
      pricesService.getPricesByTickersWithChange.mockResolvedValue(
        new Map([
          [
            'AAPL',
            {
              ticker: 'AAPL',
              price: 189.5,
              dailyChangePercent: 1.23,
              updatedAt,
            },
          ],
        ]),
      );

      const result = await service.getItems(USER_ID);

      expect(result[0].price).toBe(189.5);
      expect(result[0].dailyChangePercent).toBe(1.23);
      expect(result[0].priceUpdatedAt).toBe(updatedAt.toISOString());
    });

    it('sets price fields to null when the ticker has no price record', async () => {
      repository.findByUser.mockResolvedValue([buildItem({ ticker: 'AAPL' })]);
      edgarService.getCompany.mockRejectedValue(new NotFoundException());
      pricesService.getPricesByTickersWithChange.mockResolvedValue(
        new Map([['AAPL', null]]),
      );

      const result = await service.getItems(USER_ID);

      expect(result[0].price).toBeNull();
      expect(result[0].dailyChangePercent).toBeNull();
      expect(result[0].priceUpdatedAt).toBeNull();
    });
  });

  // ── compareMetrics ─────────────────────────────────────────────────────────

  describe('compareMetrics', () => {
    beforeEach(() => {
      repository.findOne.mockImplementation((_userId, ticker) =>
        Promise.resolve(buildItem({ ticker })),
      );
    });

    it('returns metrics for each requested ticker', async () => {
      edgarService.getMetrics
        .mockResolvedValueOnce(buildMetrics('AAPL'))
        .mockResolvedValueOnce(buildMetrics('MSFT'));

      const result = await service.compareMetrics(USER_ID, ['AAPL', 'MSFT']);

      expect(result).toHaveLength(2);
      expect(edgarService.getMetrics.mock.calls).toHaveLength(2);
    });

    it('returns an empty-metrics shell when a ticker has no available data', async () => {
      edgarService.getMetrics
        .mockResolvedValueOnce(buildMetrics('AAPL'))
        .mockRejectedValueOnce(new Error('EDGAR Facts unavailable'));

      const result = await service.compareMetrics(USER_ID, ['AAPL', 'MSFT']);

      expect(result).toHaveLength(2);
      expect(result[1].metrics.revenue).toEqual([]);
      expect(result[1].metrics.netIncome).toEqual([]);
    });

    it('throws ForbiddenException when a ticker is not in the user watchlist', async () => {
      repository.findOne.mockImplementation((_userId, ticker) => {
        if (ticker === 'GOOGL') return Promise.resolve(null);
        return Promise.resolve(buildItem({ ticker }));
      });

      await expect(
        service.compareMetrics(USER_ID, ['AAPL', 'GOOGL']),
      ).rejects.toThrow(ForbiddenException);

      expect(edgarService.getMetrics.mock.calls).toHaveLength(0);
    });
  });
});
