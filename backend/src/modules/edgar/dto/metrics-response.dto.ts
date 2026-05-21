import { IEdgarMetricPoint } from '../interfaces/edgar.interface';

export class MetricsResponseDto {
  cik: string;
  name: string;
  metrics: {
    revenue: IEdgarMetricPoint[];
    netIncome: IEdgarMetricPoint[];
    eps: IEdgarMetricPoint[];
    totalAssets: IEdgarMetricPoint[];
    totalLiabilities: IEdgarMetricPoint[];
  };
}
