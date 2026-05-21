import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PricesController } from './controller/prices.controller';
import { PricesService } from './service/prices.service';
import { PricesRepository } from './repository/prices.repository';
import { YahooFinanceClient } from './client/yahoo-finance.client';
import { PrismaService } from '../database/prisma.service';
import { YAHOO_FINANCE_CLIENT, PRICES_REPOSITORY } from './interfaces/prices.interface';

@Module({
  imports: [HttpModule],
  controllers: [PricesController],
  providers: [
    PrismaService,
    PricesService,
    { provide: PRICES_REPOSITORY, useClass: PricesRepository },
    { provide: YAHOO_FINANCE_CLIENT, useClass: YahooFinanceClient },
  ],
  exports: [PricesService],
})
export class PricesModule {}
