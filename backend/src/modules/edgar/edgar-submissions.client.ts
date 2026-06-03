import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  IEdgarSubmissionsClient,
  IEdgarFiling,
} from './interfaces/edgar.interface';

interface SecRecentFilings {
  form: string[];
  accessionNumber: string[];
  filingDate: string[];
  primaryDocument: string[];
  primaryDocDescription: string[];
}

interface SecSubmissionsResponse {
  filings?: { recent?: SecRecentFilings };
}

@Injectable()
export class EdgarSubmissionsClient implements IEdgarSubmissionsClient {
  private readonly baseUrl = 'https://data.sec.gov/submissions';
  private readonly headers = {
    'User-Agent': 'PortfolioTracker contact@portfolio.com',
  };

  constructor(private readonly httpService: HttpService) {}

  async getFilings(cik: string): Promise<IEdgarFiling[]> {
    try {
      const paddedCik = cik.padStart(10, '0');
      const response = await firstValueFrom(
        this.httpService.get<SecSubmissionsResponse>(
          `${this.baseUrl}/CIK${paddedCik}.json`,
          { headers: this.headers },
        ),
      );

      const recent = response.data?.filings?.recent;
      if (!recent) return [];

      const results: IEdgarFiling[] = [];
      const allowedForms = ['10-K', '10-Q'];
      const cikNumeric = String(parseInt(cik, 10));

      for (let i = 0; i < recent.form.length; i++) {
        if (!allowedForms.includes(recent.form[i])) continue;

        const accession = recent.accessionNumber[i];
        const primaryDocument = recent.primaryDocument[i];
        const reportUrl = primaryDocument
          ? `https://www.sec.gov/Archives/edgar/data/${cikNumeric}/${accession.replace(/-/g, '')}/${primaryDocument}`
          : `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cikNumeric}&type=${recent.form[i]}`;

        results.push({
          accessionNumber: accession,
          filingDate: recent.filingDate[i],
          form: recent.form[i],
          primaryDocument,
          description: recent.primaryDocDescription[i] ?? '',
          reportUrl,
        });

        if (results.length >= 10) break;
      }

      return results;
    } catch {
      throw new HttpException(
        'EDGAR Submissions unavailable',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
