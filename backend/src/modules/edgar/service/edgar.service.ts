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

@Injectable()
export class EdgarService {
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
  ) {}

  async syncCompany(ticker: string) {
    const company = await this.edgarClient.getCompanyByTicker(ticker);
    return this.repository.upsertCompany(company);
  }

  async getCompany(ticker: string) {
    const company = await this.repository.findByTicker(ticker);
    if (!company) throw new NotFoundException(`Ticker ${ticker} not found`);
    return company;
  }

  async getAllCompanies() {
    return this.repository.findAll();
  }

  async searchCompanies(query: string) {
    return this.searchClient.searchCompanies(query);
  }

  async getFilings(ticker: string) {
    const company = await this.syncCompany(ticker);
    return this.submissionsClient.getFilings(company.cik);
  }

  async getMetrics(ticker: string, query: QueryMetricsDto) {
    const company = await this.syncCompany(ticker);
    return this.factsClient.getMetrics(company.cik, query.quarters);
  }
}
