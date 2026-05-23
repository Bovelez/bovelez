import type {
  IEdgarCompany,
  IEdgarFiling,
  IEdgarMetrics,
  IEdgarSearchResult,
} from '../interfaces/edgar.interface';
import type { EdgarCompanyRecord } from '../repository/edgar.repository.interface';
import type { QueryMetricsDto } from '../dto/query-metrics.dto';

export type IEdgarService = {
  syncCompany(ticker: string): Promise<EdgarCompanyRecord>;
  getCompany(ticker: string): Promise<EdgarCompanyRecord>;
  getAllCompanies(): Promise<IEdgarCompany[]>;
  searchCompanies(query: string): Promise<IEdgarSearchResult[]>;
  getFilings(ticker: string): Promise<IEdgarFiling[]>;
  getMetrics(ticker: string, query: QueryMetricsDto): Promise<IEdgarMetrics>;
  isValidTicker(ticker: string): Promise<boolean>;
};
