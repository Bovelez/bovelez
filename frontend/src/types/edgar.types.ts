export type EdgarCompany = {
  cik: string;
  ticker: string;
  name: string;
};

export type EdgarCompanyRecord = EdgarCompany & {
  id: string;
  updatedAt: string;
};

export type EdgarSearchResult = {
  cik: string;
  ticker: string;
  name: string;
  filingType: string;
  filedAt: string;
  description: string;
};

export type EdgarFiling = {
  accessionNumber: string;
  filingDate: string;
  form: string;
  primaryDocument: string;
  description: string;
  reportUrl: string;
};

export type EdgarMetricPoint = {
  quarter: string;
  value: number;
  unit: string;
  filedAt: string;
};

export type EdgarMetrics = {
  cik: string;
  name: string;
  metrics: {
    revenue: EdgarMetricPoint[];
    netIncome: EdgarMetricPoint[];
    eps: EdgarMetricPoint[];
    totalAssets: EdgarMetricPoint[];
    totalLiabilities: EdgarMetricPoint[];
  };
};
