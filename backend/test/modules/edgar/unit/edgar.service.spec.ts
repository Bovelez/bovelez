import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EdgarService } from '../../../../src/modules/edgar/service/edgar.service';
import {
  EDGAR_CLIENT,
  EDGAR_SEARCH_CLIENT,
  EDGAR_FACTS_CLIENT,
  EDGAR_SUBMISSIONS_CLIENT,
} from '../../../../src/modules/edgar/interfaces/edgar.interface';
import { EDGAR_REPOSITORY } from '../../../../src/modules/edgar/repository/edgar.repository.interface';
import { QueryMetricsDto } from '../../../../src/modules/edgar/dto/query-metrics.dto';
import { PricesService } from '../../../../src/modules/prices/service/prices.service';

const mockCompany = {
  id: '1',
  cik: '320193',
  ticker: 'AAPL',
  name: 'Apple Inc.',
  updatedAt: new Date(),
};

const mockRepository = {
  findByTicker: jest.fn(),
  findAll: jest.fn(),
  upsertCompany: jest.fn(),
};

const mockEdgarClient = {
  getCompanies: jest.fn(),
  getCompanyByTicker: jest.fn(),
};

const mockSearchClient = {
  searchCompanies: jest.fn(),
};

const mockFactsClient = {
  getMetrics: jest.fn(),
};

const mockSubmissionsClient = {
  getFilings: jest.fn(),
};

const mockPricesService = {
  getAllPrices: jest.fn(),
  getPrice: jest.fn(),
};

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
};

describe('EdgarService', () => {
  let service: EdgarService;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EdgarService,
        { provide: EDGAR_REPOSITORY, useValue: mockRepository },
        { provide: EDGAR_CLIENT, useValue: mockEdgarClient },
        { provide: EDGAR_SEARCH_CLIENT, useValue: mockSearchClient },
        { provide: EDGAR_FACTS_CLIENT, useValue: mockFactsClient },
        { provide: EDGAR_SUBMISSIONS_CLIENT, useValue: mockSubmissionsClient },
        { provide: PricesService, useValue: mockPricesService },
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    service = module.get<EdgarService>(EdgarService);
  });

  describe('searchCompanies', () => {
    it('should return results from the search client', async () => {
      const results = [{ cik: '320193', ticker: 'AAPL', name: 'Apple Inc.' }];
      mockSearchClient.searchCompanies.mockResolvedValue(results);

      const result = await service.searchCompanies('apple');

      expect(mockSearchClient.searchCompanies).toHaveBeenCalledWith('apple');
      expect(result).toEqual(results);
    });

    it('should return empty array when no results found', async () => {
      mockSearchClient.searchCompanies.mockResolvedValue([]);

      const result = await service.searchCompanies('xyznotfound');

      expect(result).toEqual([]);
    });
  });

  describe('getAllCompanies', () => {
    it('should return EDGAR companies with registered prices', async () => {
      mockEdgarClient.getCompanies.mockResolvedValue([
        { cik: '320193', ticker: 'AAPL', name: 'Apple Inc.' },
        { cik: '789019', ticker: 'MSFT', name: 'Microsoft Corp.' },
        { cik: '123456', ticker: 'FAKE', name: 'Fake Corp.' },
      ]);
      mockPricesService.getAllPrices.mockResolvedValue([
        { ticker: 'AAPL', price: 200.5, updatedAt: new Date() },
        { ticker: 'MSFT', price: 420, updatedAt: new Date() },
      ]);

      const result = await service.getAllCompanies();

      expect(mockEdgarClient.getCompanies).toHaveBeenCalled();
      expect(mockPricesService.getAllPrices).toHaveBeenCalled();
      expect(result).toEqual([
        { cik: '320193', ticker: 'AAPL', name: 'Apple Inc.' },
        { cik: '789019', ticker: 'MSFT', name: 'Microsoft Corp.' },
      ]);
    });
  });

  describe('getCompany', () => {
    it('should return company when found in repository', async () => {
      mockRepository.findByTicker.mockResolvedValue(mockCompany);

      const result = await service.getCompany('AAPL');

      expect(mockRepository.findByTicker).toHaveBeenCalledWith('AAPL');
      expect(result).toEqual(mockCompany);
    });

    it('should throw NotFoundException when ticker is not cached and EDGAR sync fails', async () => {
      mockRepository.findByTicker.mockResolvedValue(null);
      mockEdgarClient.getCompanyByTicker.mockRejectedValue(
        new Error('not found in EDGAR'),
      );

      await expect(service.getCompany('FAKE')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('syncCompany', () => {
    it('should fetch from EDGAR and upsert in repository', async () => {
      const edgarCompany = {
        cik: '320193',
        ticker: 'AAPL',
        name: 'Apple Inc.',
      };
      mockEdgarClient.getCompanyByTicker.mockResolvedValue(edgarCompany);
      mockRepository.upsertCompany.mockResolvedValue(mockCompany);

      const result = await service.syncCompany('AAPL');

      expect(mockEdgarClient.getCompanyByTicker).toHaveBeenCalledWith('AAPL');
      expect(mockRepository.upsertCompany).toHaveBeenCalledWith(edgarCompany);
      expect(result).toEqual(mockCompany);
    });
  });

  describe('isValidTicker', () => {
    it('should return true when ticker exists in repository and has price', async () => {
      mockPricesService.getPrice.mockResolvedValue({
        ticker: 'AAPL',
        price: 200.5,
        updatedAt: new Date(),
      });
      mockRepository.findByTicker.mockResolvedValue(mockCompany);

      const result = await service.isValidTicker('aapl');

      expect(mockPricesService.getPrice).toHaveBeenCalledWith('AAPL');
      expect(mockRepository.findByTicker).toHaveBeenCalledWith('AAPL');
      expect(result).toBe(true);
    });

    it('should return true when ticker exists in EDGAR and has price', async () => {
      mockPricesService.getPrice.mockResolvedValue({
        ticker: 'MSFT',
        price: 420,
        updatedAt: new Date(),
      });
      mockRepository.findByTicker.mockResolvedValue(null);
      mockEdgarClient.getCompanyByTicker.mockResolvedValue({
        cik: '789019',
        ticker: 'MSFT',
        name: 'Microsoft Corp.',
      });

      const result = await service.isValidTicker('MSFT');

      expect(mockEdgarClient.getCompanyByTicker).toHaveBeenCalledWith('MSFT');
      expect(result).toBe(true);
    });

    it('should return false when ticker has no registered price', async () => {
      mockPricesService.getPrice.mockResolvedValue(null);

      const result = await service.isValidTicker('FAKE');

      expect(mockRepository.findByTicker).not.toHaveBeenCalled();
      expect(mockEdgarClient.getCompanyByTicker).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('getMetrics', () => {
    it('should sync company and return metrics for given quarters', async () => {
      const metrics = { revenues: [], netIncome: [] };
      const edgarCompany = {
        cik: '320193',
        ticker: 'AAPL',
        name: 'Apple Inc.',
      };
      mockEdgarClient.getCompanyByTicker.mockResolvedValue(edgarCompany);
      mockRepository.upsertCompany.mockResolvedValue(mockCompany);
      mockFactsClient.getMetrics.mockResolvedValue(metrics);

      const query: QueryMetricsDto = { quarters: 4 };
      const result = await service.getMetrics('AAPL', query);

      expect(mockFactsClient.getMetrics).toHaveBeenCalledWith('320193', 4);
      expect(result).toEqual(metrics);
    });

    it('should return cached metrics without hitting EDGAR', async () => {
      const cachedMetrics = { revenues: [{ value: 1 }] };
      mockCache.get.mockResolvedValue(cachedMetrics);

      const query: QueryMetricsDto = { quarters: 4 };
      const result = await service.getMetrics('AAPL', query);

      expect(mockCache.get).toHaveBeenCalledWith('edgar:metrics:AAPL:4');
      expect(mockFactsClient.getMetrics).not.toHaveBeenCalled();
      expect(mockEdgarClient.getCompanyByTicker).not.toHaveBeenCalled();
      expect(result).toEqual(cachedMetrics);
    });

    it('should store fetched metrics in cache', async () => {
      const metrics = { revenues: [], netIncome: [] };
      mockEdgarClient.getCompanyByTicker.mockResolvedValue({
        cik: '320193',
        ticker: 'AAPL',
        name: 'Apple Inc.',
      });
      mockRepository.upsertCompany.mockResolvedValue(mockCompany);
      mockFactsClient.getMetrics.mockResolvedValue(metrics);

      await service.getMetrics('AAPL', { quarters: 4 });

      expect(mockCache.set).toHaveBeenCalledWith(
        'edgar:metrics:AAPL:4',
        metrics,
        24 * 60 * 60 * 1000,
      );
    });
  });

  describe('getFilings', () => {
    it('should sync company and return filings', async () => {
      const filings = [{ type: '10-K', date: '2024-01-01' }];
      const edgarCompany = {
        cik: '320193',
        ticker: 'AAPL',
        name: 'Apple Inc.',
      };
      mockEdgarClient.getCompanyByTicker.mockResolvedValue(edgarCompany);
      mockRepository.upsertCompany.mockResolvedValue(mockCompany);
      mockSubmissionsClient.getFilings.mockResolvedValue(filings);

      const result = await service.getFilings('AAPL');

      expect(mockSubmissionsClient.getFilings).toHaveBeenCalledWith('320193');
      expect(result).toEqual(filings);
    });

    it('should return cached filings without hitting EDGAR', async () => {
      const cachedFilings = [{ type: '10-Q', date: '2024-04-01' }];
      mockCache.get.mockResolvedValue(cachedFilings);

      const result = await service.getFilings('AAPL');

      expect(mockCache.get).toHaveBeenCalledWith('edgar:filings:AAPL');
      expect(mockSubmissionsClient.getFilings).not.toHaveBeenCalled();
      expect(mockEdgarClient.getCompanyByTicker).not.toHaveBeenCalled();
      expect(result).toEqual(cachedFilings);
    });
  });
});
