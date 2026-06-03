import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class EdgarService implements IEdgarService {
  constructor(
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
    return this.searchClient.searchCompanies(query);
  }

  async getFilings(ticker: string) {
    const company = await this.syncCompany(ticker);
    return this.submissionsClient.getFilings(company.cik);
  }

  async getMetrics(ticker: string, query: QueryMetricsDto) {
    const existing = await this.repository.findByTicker(ticker);
    const company = existing ?? await this.syncCompany(ticker);
    return this.factsClient.getMetrics(company.cik, query.quarters);
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
