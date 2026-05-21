export type EdgarTickerEntry = {
  cik_str: number;
  ticker: string;
  title: string;
};

export type EdgarSubmissions = {
  cik: string;
  name: string;
  tickers: string[];
  exchanges: string[];
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      form: string[];
      primaryDocument: string[];
    };
  };
};

export type EdgarCompanyFacts = {
  cik: number;
  entityName: string;
  facts: {
    'us-gaap'?: Record<string, EdgarConceptData>;
    dei?: Record<string, EdgarConceptData>;
  };
};

export type EdgarConceptUnit = {
  accn: string;
  cik: number;
  entityName: string;
  loc: string;
  end: string;
  val: number;
  form: string;
  filed: string;
  frame?: string;
  start?: string;
};

export type EdgarConceptData = {
  label: string;
  description: string;
  units: Record<string, EdgarConceptUnit[]>;
};

export type EdgarSearchResult = {
  hits: {
    total: { value: number };
    hits: Array<{
      _id: string;
      _source: {
        period_of_report: string;
        entity_name: string;
        file_num: string;
        form_type: string;
        file_date: string;
      };
    }>;
  };
};

export interface IEdgarService {
  getCompanyTickers(): Promise<Record<string, EdgarTickerEntry>>;
  getCompanySubmissions(cik: string): Promise<EdgarSubmissions>;
  getCompanyFacts(cik: string): Promise<EdgarCompanyFacts>;
  getCompanyConcept(cik: string, concept: string): Promise<EdgarConceptData>;
  searchFilings(query: string): Promise<EdgarSearchResult>;
  isValidTicker(ticker: string): Promise<boolean>;
}
