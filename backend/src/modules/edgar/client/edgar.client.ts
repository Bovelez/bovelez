import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IEdgarClient, IEdgarCompany } from '../interfaces/edgar.interface';

interface SecTickerEntry {
  cik_str: number;
  ticker: string;
  title: string;
}

@Injectable()
export class EdgarClient implements IEdgarClient {
  private readonly tickersUrl =
    'https://www.sec.gov/files/company_tickers.json';
  private readonly headers = {
    'User-Agent': 'PortfolioTracker contact@portfolio.com',
  };

  constructor(private readonly httpService: HttpService) {}

  async getCompanies(): Promise<IEdgarCompany[]> {
    const data = await this.getTickerEntries();

    return Object.values(data)
      .map((entry) => ({
        cik: String(entry.cik_str),
        ticker: entry.ticker.toUpperCase(),
        name: entry.title,
      }))
      .sort((a, b) => a.ticker.localeCompare(b.ticker));
  }

  async getCompanyByTicker(ticker: string): Promise<IEdgarCompany> {
    const data = await this.getTickerEntries();
    const upperTicker = ticker.toUpperCase();
    const entry = Object.values(data).find(
      (e) => e.ticker.toUpperCase() === upperTicker,
    );

    if (!entry) {
      throw new NotFoundException(`Ticker ${ticker} not found in EDGAR`);
    }

    return {
      cik: String(entry.cik_str),
      ticker: entry.ticker.toUpperCase(),
      name: entry.title,
    };
  }

  private async getTickerEntries(): Promise<Record<string, SecTickerEntry>> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<Record<string, SecTickerEntry>>(this.tickersUrl, {
          headers: this.headers,
        }),
      );
      return response.data;
    } catch {
      throw new HttpException(
        'EDGAR company lookup unavailable',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
