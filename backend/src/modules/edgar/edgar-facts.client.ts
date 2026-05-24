import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  IEdgarFactsClient,
  IEdgarMetrics,
  IEdgarMetricPoint,
} from './interfaces/edgar.interface';

type FactEntry = {
  form: string;
  fp?: string;
  fy?: number;
  val: number;
  filed: string;
  start?: string;
  end?: string;
};

@Injectable()
export class EdgarFactsClient implements IEdgarFactsClient {
  private readonly baseUrl = 'https://data.sec.gov/api/xbrl/companyfacts';
  private readonly headers = {
    'User-Agent': 'PortfolioTracker contact@portfolio.com',
  };

  private readonly conceptMap = {
    revenue: [
      'RevenueFromContractWithCustomerExcludingAssessedTax',
      'Revenues',
      'SalesRevenueNet',
    ],
    netIncome: ['NetIncomeLoss'],
    eps: ['EarningsPerShareBasic', 'EarningsPerShareDiluted'],
    totalAssets: ['Assets'],
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
      const usGaap =
        (data?.['facts'] as Record<string, unknown>)?.['us-gaap'] ?? {};

      return {
        cik,
        name: (data?.['entityName'] as string) ?? '',
        metrics: {
          revenue: this.extractMetric(usGaap, this.conceptMap.revenue, quarters, true),
          netIncome: this.extractMetric(usGaap, this.conceptMap.netIncome, quarters, true),
          eps: this.extractMetric(usGaap, this.conceptMap.eps, quarters, true),
          totalAssets: this.extractMetric(usGaap, this.conceptMap.totalAssets, quarters, false),
          totalLiabilities: this.extractMetric(usGaap, this.conceptMap.totalLiabilities, quarters, false),
        },
      };
    } catch {
      throw new HttpException(
        'EDGAR Facts unavailable',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private extractMetric(
    usGaap: unknown,
    concepts: string[],
    quarters: number,
    isFlow: boolean,
  ): IEdgarMetricPoint[] {
    const gaap = usGaap as Record<
      string,
      { units?: Record<string, unknown[]> }
    >;

    for (const concept of concepts) {
      const units = gaap?.[concept]?.units;
      if (!units) continue;

      const unitKey =
        units['USD'] !== undefined
          ? 'USD'
          : units['USD/shares'] !== undefined
            ? 'USD/shares'
            : units['shares'] !== undefined
              ? 'shares'
              : units['pure'] !== undefined
                ? 'pure'
                : Object.keys(units)[0];

      const entries = (units[unitKey] ?? []) as FactEntry[];

      const reports = entries.filter(
        (e) => (e.form === '10-Q' || e.form === '10-K') && e.fp && e.fy && e.end,
      );

      const periodFiltered = isFlow
        ? reports.filter((e) => this.isQuarterlyPeriod(e))
        : reports;

      // Deduplicate by quarter key, keeping the most recently filed value (amendments win)
      const dedup = new Map<string, FactEntry>();
      for (const e of periodFiltered) {
        const key = this.quarterKey(e);
        const existing = dedup.get(key);
        if (!existing || e.filed > existing.filed) dedup.set(key, e);
      }

      // Sort by end date ascending so the chart reads left-to-right oldest-to-newest
      const sorted = [...dedup.values()].sort((a, b) =>
        (a.end ?? '').localeCompare(b.end ?? ''),
      );

      const latest = sorted.slice(-quarters);

      if (latest.length > 0) {
        return latest.map((e) => ({
          quarter: this.quarterLabel(e),
          value: e.val,
          unit: unitKey,
          filedAt: e.filed,
        }));
      }
    }
    return [];
  }

  // Flow metrics (revenue, net income, EPS) report cumulative YTD values in
  // 10-K (full year) and 10-Q (Q1=3mo, Q2=6mo, Q3=9mo from fiscal start). We only
  // want the quarterly slice — entries whose start/end span ~3 months.
  private isQuarterlyPeriod(e: FactEntry): boolean {
    if (!e.start || !e.end) return false;
    const startMs = Date.parse(e.start);
    const endMs = Date.parse(e.end);
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) return false;
    const days = (endMs - startMs) / (1000 * 60 * 60 * 24);
    return days >= 80 && days <= 100;
  }

  private quarterKey(e: FactEntry): string {
    if (e.end) return e.end;
    return `${e.fp ?? ''} ${e.fy ?? ''}`;
  }

  private quarterLabel(e: FactEntry): string {
    if (e.end) {
      const d = new Date(e.end);
      const month = d.getUTCMonth() + 1;
      const q = Math.ceil(month / 3);
      return `Q${q} ${d.getUTCFullYear()}`;
    }
    return `${e.fp ?? ''} ${e.fy ?? ''}`;
  }
}
