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

      for (let i = 0; i < recent.form.length; i++) {
        if (!allowedForms.includes(recent.form[i])) continue;

        results.push({
          accessionNumber: recent.accessionNumber[i],
          filingDate: recent.filingDate[i],
          form: recent.form[i],
          primaryDocument: recent.primaryDocument[i],
          description: recent.primaryDocDescription[i] ?? '',
        });

        if (results.length >= 10) break;
      }

      return results;
    } catch {
      throw new HttpException('EDGAR Submissions unavailable', HttpStatus.BAD_GATEWAY);
    }
  }
}
