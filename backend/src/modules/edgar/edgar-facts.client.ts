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
      'RevenuesNetOfInterestExpense',
      'Revenues',
      'SalesRevenueNet',
      'InterestAndDividendIncomeOperating',
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

    // Pick the concept whose latest entry is most recent — many companies
    // (e.g. JPM) have legacy entries under one concept and current data under
    // another, so first-non-empty would silently return stale data.
    let best: { sorted: FactEntry[]; unitKey: string; latestEnd: string } | null = null;

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

      const quarterly = isFlow
        ? this.buildFlowQuarters(reports)
        : this.dedupByEnd(reports);

      const sorted = quarterly.sort((a, b) =>
        (a.end ?? '').localeCompare(b.end ?? ''),
      );
      if (sorted.length === 0) continue;

      const latestEnd = sorted[sorted.length - 1].end ?? '';
      if (!best || latestEnd > best.latestEnd) {
        best = { sorted, unitKey, latestEnd };
      }
    }

    if (!best) return [];

    return best.sorted.slice(-quarters).map((e) => ({
      quarter: this.quarterLabel(e),
      value: e.val,
      unit: best.unitKey,
      filedAt: e.filed,
    }));
  }

  // Flow metrics (revenue, net income, EPS) are reported cumulatively in 10-K
  // filings (full fiscal year). 10-Q filings carry a ~3-month current-quarter
  // slice (along with YTD periods we ignore). We keep the 3-month entries
  // directly, and synthesize the missing Q4 by subtracting the three preceding
  // 3-month quarters from the 10-K annual total. EDGAR re-tags prior quarters
  // under later fiscal-year labels after restatements, so we match by date
  // range (quarter ends within the annual period and at least one quarter
  // before its end) rather than by `fy`.
  private buildFlowQuarters(reports: FactEntry[]): FactEntry[] {
    const quarterEntries = this.dedupByEnd(
      reports.filter((e) => this.isQuarterlyPeriod(e)),
    );
    const annualEntries = this.dedupByEnd(
      reports.filter(
        (e) =>
          e.form === '10-K' && e.fp === 'FY' && this.isAnnualPeriod(e),
      ),
    );

    const synthetic: FactEntry[] = [];
    for (const annual of annualEntries) {
      if (!annual.start || !annual.end) continue;
      const annualStartMs = Date.parse(annual.start);
      const annualEndMs = Date.parse(annual.end);
      if (Number.isNaN(annualStartMs) || Number.isNaN(annualEndMs)) continue;

      const dayMs = 1000 * 60 * 60 * 24;
      const preceding = quarterEntries.filter((q) => {
        if (!q.end) return false;
        const qEndMs = Date.parse(q.end);
        if (Number.isNaN(qEndMs)) return false;
        return (
          qEndMs > annualStartMs && (annualEndMs - qEndMs) / dayMs >= 80
        );
      });

      if (preceding.length !== 3) continue;
      const sumQ123 = preceding.reduce((acc, e) => acc + e.val, 0);
      synthetic.push({
        form: annual.form,
        fp: 'Q4',
        fy: annual.fy,
        val: annual.val - sumQ123,
        filed: annual.filed,
        end: annual.end,
        start: annual.start,
      });
    }

    return [...quarterEntries, ...synthetic];
  }

  private isQuarterlyPeriod(e: FactEntry): boolean {
    if (!e.start || !e.end) return false;
    const startMs = Date.parse(e.start);
    const endMs = Date.parse(e.end);
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) return false;
    const days = (endMs - startMs) / (1000 * 60 * 60 * 24);
    return days >= 80 && days <= 100;
  }

  private isAnnualPeriod(e: FactEntry): boolean {
    if (!e.start || !e.end) return false;
    const startMs = Date.parse(e.start);
    const endMs = Date.parse(e.end);
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) return false;
    const days = (endMs - startMs) / (1000 * 60 * 60 * 24);
    return days >= 350 && days <= 380;
  }

  private dedupByEnd(entries: FactEntry[]): FactEntry[] {
    const dedup = new Map<string, FactEntry>();
    for (const e of entries) {
      const key = this.quarterKey(e);
      const existing = dedup.get(key);
      if (!existing || e.filed > existing.filed) dedup.set(key, e);
    }
    return [...dedup.values()];
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
