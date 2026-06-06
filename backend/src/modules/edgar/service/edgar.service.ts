import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { EdgarRepository } from '../repository/edgar.repository';
import {
  EDGAR_CLIENT,
  EDGAR_SEARCH_CLIENT,
  EDGAR_FACTS_CLIENT,
  EDGAR_SUBMISSIONS_CLIENT,
  type IEdgarClient,
  type IEdgarSearchClient,
  type IEdgarFactsClient,
  type IEdgarSubmissionsClient,
} from '../interfaces/edgar.interface';
import { EDGAR_REPOSITORY } from '../repository/edgar.repository.interface';
import { QueryMetricsDto } from '../dto/query-metrics.dto';
import { PricesService } from '../../prices/service/prices.service';
import type { IEdgarService } from './edgar.service.interface';
import type {
  IEdgarFiling,
  IEdgarMetrics,
  IEdgarSearchResult,
} from '../interfaces/edgar.interface';

//Save for 24hs on Cache
const EDGAR_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class EdgarService implements IEdgarService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    @Inject(EDGAR_REPOSITORY)
    private readonly repository: EdgarRepository,
    @Inject(EDGAR_CLIENT)
    private readonly edgarClient: IEdgarClient,
    @Inject(EDGAR_SEARCH_CLIENT)
    private readonly searchClient: IEdgarSearchClient,
    @Inject(EDGAR_FACTS_CLIENT)
    private readonly factsClient: IEdgarFactsClient,
    @Inject(EDGAR_SUBMISSIONS_CLIENT)
    private readonly submissionsClient: IEdgarSubmissionsClient,
    private readonly pricesService: PricesService,
  ) {}

  async syncCompany(ticker: string) {
    const company = await this.edgarClient.getCompanyByTicker(ticker);
    return this.repository.upsertCompany(company);
  }

  async getCompany(ticker: string) {
    const normalized = ticker.trim().toUpperCase();
    const cached = await this.repository.findByTicker(normalized);
    if (cached) return cached;

    try {
      return await this.syncCompany(normalized);
    } catch {
      throw new NotFoundException(`Ticker ${ticker} not found`);
    }
  }

  async getAllCompanies() {
    const [companies, prices] = await Promise.all([
      this.edgarClient.getCompanies(),
      this.pricesService.getAllPrices(),
    ]);
    const tradableTickers = new Set(
      prices.map((price) => price.ticker.trim().toUpperCase()),
    );

    return companies.filter((company) => tradableTickers.has(company.ticker));
  }

  async searchCompanies(query: string) {
    const cacheKey = `edgar:search:${query.trim().toLowerCase()}`;
    const cached = await this.cache.get<IEdgarSearchResult[]>(cacheKey);
    if (cached) return cached;

    const results = await this.searchClient.searchCompanies(query);
    await this.cache.set(cacheKey, results, EDGAR_CACHE_TTL_MS);
    return results;
  }

  async getFilings(ticker: string) {
    const cacheKey = `edgar:filings:${ticker.trim().toUpperCase()}`;
    const cached = await this.cache.get<IEdgarFiling[]>(cacheKey);
    if (cached) return cached;

    const company = await this.syncCompany(ticker);
    const filings = await this.submissionsClient.getFilings(company.cik);
    await this.cache.set(cacheKey, filings, EDGAR_CACHE_TTL_MS);
    return filings;
  }

  async getMetrics(ticker: string, query: QueryMetricsDto) {
    const cacheKey = `edgar:metrics:${ticker.trim().toUpperCase()}:${query.quarters}`;
    const cached = await this.cache.get<IEdgarMetrics>(cacheKey);
    if (cached) return cached;

    const existing = await this.repository.findByTicker(ticker);
    const company = existing ?? (await this.syncCompany(ticker));
    const metrics = await this.factsClient.getMetrics(
      company.cik,
      query.quarters,
    );
    await this.cache.set(cacheKey, metrics, EDGAR_CACHE_TTL_MS);
    return metrics;
  }

  async isValidTicker(ticker: string): Promise<boolean> {
    const normalizedTicker = ticker.trim().toUpperCase();
    const price = await this.pricesService.getPrice(normalizedTicker);
    if (!price) return false;

    const company = await this.repository.findByTicker(normalizedTicker);
    if (company) return true;

    try {
      await this.edgarClient.getCompanyByTicker(normalizedTicker);
      return true;
    } catch {
      return false;
    }
  }
}
