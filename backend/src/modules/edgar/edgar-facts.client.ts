import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  IEdgarFactsClient,
  IEdgarMetrics,
  IEdgarMetricPoint,
} from './interfaces/edgar.interface';

@Injectable()
export class EdgarFactsClient implements IEdgarFactsClient {
  private readonly baseUrl = 'https://data.sec.gov/api/xbrl/companyfacts';
  private readonly headers = {
    'User-Agent': 'PortfolioTracker contact@portfolio.com',
  };

  private readonly conceptMap = {
    revenue:          ['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax'],
    netIncome:        ['NetIncomeLoss'],
    eps:              ['EarningsPerShareBasic'],
    totalAssets:      ['Assets'],
    totalLiabilities: ['Liabilities'],
  };

  constructor(private readonly httpService: HttpService) {}

  async getMetrics(cik: string, quarters = 4): Promise<IEdgarMetrics> {
    try {
      const paddedCik = cik.padStart(10, '0');
      const response = await firstValueFrom(
        this.httpService.get<Record<string, unknown>>(
          `${this.baseUrl}/CIK${paddedCik}.json`,
          { headers: this.headers },
        ),
      );
      const data = response.data;
      const usGaap = (data?.['facts'] as Record<string, unknown>)?.['us-gaap'] ?? {};

      return {
        cik,
        name: (data?.['entityName'] as string) ?? '',
        metrics: {
          revenue:          this.extractMetric(usGaap, this.conceptMap.revenue, quarters),
          netIncome:        this.extractMetric(usGaap, this.conceptMap.netIncome, quarters),
          eps:              this.extractMetric(usGaap, this.conceptMap.eps, quarters),
          totalAssets:      this.extractMetric(usGaap, this.conceptMap.totalAssets, quarters),
          totalLiabilities: this.extractMetric(usGaap, this.conceptMap.totalLiabilities, quarters),
        },
      };
    } catch {
      throw new HttpException('EDGAR Facts unavailable', HttpStatus.BAD_GATEWAY);
    }
  }

  private extractMetric(
    usGaap: unknown,
    concepts: string[],
    quarters: number,
  ): IEdgarMetricPoint[] {
    const gaap = usGaap as Record<string, { units?: Record<string, unknown[]> }>;
    for (const concept of concepts) {
      const units = gaap?.[concept]?.units;
      if (!units) continue;

      const entries =
        (units['USD'] ?? units['shares'] ?? units['pure'] ?? []) as {
          form: string; fp?: string; fy?: number; val: number; filed: string;
        }[];

      const filtered = entries
        .filter((e) => e.form === '10-Q' || e.form === '10-K')
        .filter((e) => e.fp && e.fy)
        .slice(-quarters)
        .map((e) => ({
          quarter: `${e.fp} ${e.fy}`,
          value: e.val,
          unit: Object.keys(units)[0],
          filedAt: e.filed,
        }));

      if (filtered.length > 0) return filtered;
    }
    return [];
  }
}
