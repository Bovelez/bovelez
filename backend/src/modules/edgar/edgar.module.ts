import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EdgarController } from './controller/edgar.controller';
import { EdgarService } from './service/edgar.service';
import { EdgarRepository } from './repository/edgar.repository';
import { EdgarClient } from './client/edgar.client';
import { EdgarSearchClient } from './edgar-search.client';
import { EdgarFactsClient } from './edgar-facts.client';
import { EdgarSubmissionsClient } from './edgar-submissions.client';
import { PrismaService } from '../database/prisma.service';
import { PricesModule } from '../prices/prices.module';
import {
  EDGAR_CLIENT,
  EDGAR_SEARCH_CLIENT,
  EDGAR_FACTS_CLIENT,
  EDGAR_SUBMISSIONS_CLIENT,
} from './interfaces/edgar.interface';
import { EDGAR_REPOSITORY } from './repository/edgar.repository.interface';

@Module({
  imports: [HttpModule, PricesModule],
  controllers: [EdgarController],
  providers: [
    EdgarService,
    { provide: 'EdgarService', useExisting: EdgarService },
    PrismaService,
    { provide: EDGAR_REPOSITORY, useClass: EdgarRepository },
    { provide: EDGAR_CLIENT, useClass: EdgarClient },
    { provide: EDGAR_SEARCH_CLIENT, useClass: EdgarSearchClient },
    { provide: EDGAR_FACTS_CLIENT, useClass: EdgarFactsClient },
    { provide: EDGAR_SUBMISSIONS_CLIENT, useClass: EdgarSubmissionsClient },
  ],
  exports: [EdgarService, 'EdgarService'],
})
export class EdgarModule {}
