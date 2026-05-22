import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type {
  IYahooFinanceClient,
  IFetchPricesResult,
} from '../interfaces/prices.interface';

interface PriceServiceResponse {
  prices: Record<string, number>;
  errors: Record<string, string>;
}

@Injectable()
export class YahooFinanceClient implements IYahooFinanceClient {
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>(
      'PRICE_SERVICE_URL',
      'http://price-service:8000',
    );
  }

  async fetchPrices(tickers: string[]): Promise<IFetchPricesResult> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<PriceServiceResponse>(
          `${this.baseUrl}/prices/fetch`,
          { tickers },
        ),
      );
      return response.data;
    } catch {
      throw new HttpException(
        'Price service unavailable',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
