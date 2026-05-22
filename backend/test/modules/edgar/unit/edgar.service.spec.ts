import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EdgarService } from '../../../../src/modules/edgar/service/edgar.service';
import {
  EDGAR_CLIENT,
  EDGAR_SEARCH_CLIENT,
  EDGAR_FACTS_CLIENT,
  EDGAR_SUBMISSIONS_CLIENT,
} from '../../../../src/modules/edgar/interfaces/edgar.interface';
import { EDGAR_REPOSITORY } from '../../../../src/modules/edgar/repository/edgar.repository.interface';
import { QueryMetricsDto } from '../../../../src/modules/edgar/dto/query-metrics.dto';

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

describe('EdgarService', () => {
  let service: EdgarService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EdgarService,
        { provide: EDGAR_REPOSITORY, useValue: mockRepository },
        { provide: EDGAR_CLIENT, useValue: mockEdgarClient },
        { provide: EDGAR_SEARCH_CLIENT, useValue: mockSearchClient },
        { provide: EDGAR_FACTS_CLIENT, useValue: mockFactsClient },
        { provide: EDGAR_SUBMISSIONS_CLIENT, useValue: mockSubmissionsClient },
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

  describe('getCompany', () => {
    it('should return company when found in repository', async () => {
      mockRepository.findByTicker.mockResolvedValue(mockCompany);

      const result = await service.getCompany('AAPL');

      expect(mockRepository.findByTicker).toHaveBeenCalledWith('AAPL');
      expect(result).toEqual(mockCompany);
    });

    it('should throw NotFoundException when ticker not found', async () => {
      mockRepository.findByTicker.mockResolvedValue(null);

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
  });
});
