import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  IEdgarService,
  EdgarTickerEntry,
  EdgarSubmissions,
  EdgarCompanyFacts,
  EdgarConceptData,
  EdgarSearchResult,
} from './edgar.service.interface';

const BASE_DATA = 'https://data.sec.gov';
const BASE_EFTS = 'https://efts.sec.gov';
const TICKERS_URL = 'https://www.sec.gov/files/company_tickers.json';
const TICKER_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function padCik(cik: string): string {
  return cik.padStart(10, '0');
}

@Injectable()
export class EdgarService implements IEdgarService {
  private readonly logger = new Logger(EdgarService.name);
  private readonly userAgent: string;
  private tickerCache: { tickers: Set<string>; loadedAt: number } | null = null;

  constructor(private readonly configService: ConfigService) {
    this.userAgent =
      this.configService.get<string>('SEC_USER_AGENT') ??
      'Bovelez Portfolio Tracker contact@bovelez.local';
  }

  getCompanyTickers(): Promise<Record<string, EdgarTickerEntry>> {
    return this.get<Record<string, EdgarTickerEntry>>(TICKERS_URL);
  }

  getCompanySubmissions(cik: string): Promise<EdgarSubmissions> {
    return this.get<EdgarSubmissions>(
      `${BASE_DATA}/submissions/CIK${padCik(cik)}.json`,
    );
  }

  getCompanyFacts(cik: string): Promise<EdgarCompanyFacts> {
    return this.get<EdgarCompanyFacts>(
      `${BASE_DATA}/api/xbrl/companyfacts/CIK${padCik(cik)}.json`,
    );
  }

  getCompanyConcept(cik: string, concept: string): Promise<EdgarConceptData> {
    return this.get<EdgarConceptData>(
      `${BASE_DATA}/api/xbrl/companyconcept/CIK${padCik(cik)}/us-gaap/${concept}.json`,
    );
  }

  searchFilings(query: string): Promise<EdgarSearchResult> {
    const url = `${BASE_EFTS}/LATEST/search-index?q=${encodeURIComponent(query)}&forms=10-K`;
    return this.get<EdgarSearchResult>(url);
  }

  async isValidTicker(ticker: string): Promise<boolean> {
    const normalized = ticker.trim().toUpperCase();
    if (!normalized) return false;

    const tickers = await this.loadTickerSet();
    return tickers.has(normalized);
  }

  private async loadTickerSet(): Promise<Set<string>> {
    if (
      this.tickerCache &&
      Date.now() - this.tickerCache.loadedAt < TICKER_CACHE_TTL_MS
    ) {
      return this.tickerCache.tickers;
    }

    try {
      const data = await this.getCompanyTickers();
      const tickers = new Set(
        Object.values(data).map((entry) => entry.ticker.toUpperCase()),
      );
      this.tickerCache = { tickers, loadedAt: Date.now() };
      return tickers;
    } catch (err) {
      this.logger.warn(`Failed to load EDGAR ticker list: ${String(err)}`);
      if (this.tickerCache) return this.tickerCache.tickers;
      throw err;
    }
  }

  private async get<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      headers: { 'User-Agent': this.userAgent, Accept: 'application/json' },
    });

    if (!response.ok) {
      this.logger.warn(`EDGAR request failed [${response.status}]: ${url}`);
      throw new Error(`EDGAR request failed: ${response.status} ${url}`);
    }

    return response.json() as Promise<T>;
  }
}
