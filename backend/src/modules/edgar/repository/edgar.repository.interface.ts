import { IEdgarCompany } from '../interfaces/edgar.interface';

export interface EdgarCompanyRecord {
  id: string;
  cik: string;
  ticker: string;
  name: string;
  updatedAt: Date;
}

export interface IEdgarRepository {
  upsertCompany(company: IEdgarCompany): Promise<EdgarCompanyRecord>;
  findByTicker(ticker: string): Promise<EdgarCompanyRecord | null>;
  findAll(): Promise<EdgarCompanyRecord[]>;
}

export const EDGAR_REPOSITORY = 'EdgarRepository';
