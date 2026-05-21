import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  IEdgarSearchClient,
  IEdgarSearchResult,
} from './interfaces/edgar.interface';

interface SecSearchSource {
  entity_id?: string;
  display_names?: string[];
  file_type?: string;
  period_of_report?: string;
  file_description?: string;
}

interface SecSearchHit {
  _source?: SecSearchSource;
}

interface SecSearchResponse {
  hits?: { hits?: SecSearchHit[] };
}

@Injectable()
export class EdgarSearchClient implements IEdgarSearchClient {
  private readonly baseUrl = 'https://efts.sec.gov/LATEST/search-index';
  private readonly headers = {
    'User-Agent': 'PortfolioTracker contact@portfolio.com',
  };

  constructor(private readonly httpService: HttpService) {}

  async searchCompanies(query: string): Promise<IEdgarSearchResult[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<SecSearchResponse>(this.baseUrl, {
          headers: this.headers,
          params: { q: query, forms: '10-K' },
        }),
      );

      const hits = response.data?.hits?.hits ?? [];

      // Deduplica por CIK — el endpoint devuelve un filing por hit, no una empresa
      const seen = new Set<string>();
      const results: IEdgarSearchResult[] = [];

      for (const hit of hits) {
        const src = hit._source;
        if (!src) continue;

        // entity_id viene con ceros iniciales: "0000320193"
        const cik = src.entity_id?.replace(/^0+/, '') ?? '';
        if (!cik || seen.has(cik)) continue;
        seen.add(cik);

        // display_names: ["Apple Inc.  (AAPL)  (CIK 0000320193)"]
        const displayName = src.display_names?.[0] ?? '';
        const tickerMatch = displayName.match(/\(([A-Z]{1,5})\)/);
        const ticker = tickerMatch?.[1] ?? '';
        const name = displayName.replace(/\s*\([^)]*\)\s*/g, '').trim();

        results.push({
          cik,
          ticker,
          name: name || displayName,
          filingType: src.file_type ?? '10-K',
          filedAt: src.period_of_report ?? '',
          description: src.file_description ?? '',
        });
      }

      return results;
    } catch {
      throw new HttpException(
        'EDGAR Search unavailable',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
