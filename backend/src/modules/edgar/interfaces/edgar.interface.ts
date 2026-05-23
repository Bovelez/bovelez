export interface IEdgarCompany {
  cik: string;
  ticker: string;
  name: string;
}

export interface IEdgarSearchResult {
  cik: string;
  ticker: string;
  name: string;
  filingType: string;
  filedAt: string;
  description: string;
}

export interface IEdgarFiling {
  accessionNumber: string;
  filingDate: string;
  form: string;
  primaryDocument: string;
  description: string;
}
export interface IEdgarMetricPoint {
  quarter: string;
  value: number;
  unit: string;
  filedAt: string;
}

export interface IEdgarMetrics {
  cik: string;
  name: string;
  metrics: {
    revenue: IEdgarMetricPoint[];
    netIncome: IEdgarMetricPoint[];
    eps: IEdgarMetricPoint[];
    totalAssets: IEdgarMetricPoint[];
    totalLiabilities: IEdgarMetricPoint[];
  };
}

export const EDGAR_CLIENT = 'EDGAR_CLIENT';
export const EDGAR_SEARCH_CLIENT = 'EDGAR_SEARCH_CLIENT';
export const EDGAR_FACTS_CLIENT = 'EDGAR_FACTS_CLIENT';
export const EDGAR_SUBMISSIONS_CLIENT = 'EDGAR_SUBMISSIONS_CLIENT';

export interface IEdgarClient {
  getCompanies(): Promise<IEdgarCompany[]>;
  getCompanyByTicker(ticker: string): Promise<IEdgarCompany>;
}

export interface IEdgarSearchClient {
  searchCompanies(query: string): Promise<IEdgarSearchResult[]>;
}

export interface IEdgarFactsClient {
  getMetrics(cik: string, quarters?: number): Promise<IEdgarMetrics>;
}

export interface IEdgarSubmissionsClient {
  getFilings(cik: string): Promise<IEdgarFiling[]>;
}
