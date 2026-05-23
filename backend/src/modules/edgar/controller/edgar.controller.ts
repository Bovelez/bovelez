import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { EdgarService } from '../service/edgar.service';
import { QueryMetricsDto } from '../dto/query-metrics.dto';
import { Public } from '../../auth/decorators/public.decorator';

@Public()
@Controller('edgar')
export class EdgarController {
  constructor(private readonly service: EdgarService) {}

  @Get('search')
  search(@Query('q') query: string) {
    return this.service.searchCompanies(query);
  }

  @Get('companies')
  getAll() {
    return this.service.getAllCompanies();
  }

  @Get('companies/:ticker')
  getOne(@Param('ticker') ticker: string) {
    return this.service.getCompany(ticker);
  }

  @Patch('companies/:ticker/sync')
  sync(@Param('ticker') ticker: string) {
    return this.service.syncCompany(ticker);
  }
  @Get('companies/:ticker/filings')
  getFilings(@Param('ticker') ticker: string) {
    return this.service.getFilings(ticker);
  }

  @Get('companies/:ticker/metrics')
  getMetrics(@Param('ticker') ticker: string, @Query() query: QueryMetricsDto) {
    return this.service.getMetrics(ticker, query);
  }
}
