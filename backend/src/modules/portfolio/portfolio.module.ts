import { Module } from '@nestjs/common';
import { PricesModule } from '../prices/prices.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { PortfolioController } from './controller/portfolio.controller';
import { PortfolioService } from './service/portfolio.service';

@Module({
  imports: [PricesModule, TransactionsModule],
  controllers: [PortfolioController],
  providers: [PortfolioService],
  exports: [PortfolioService],
})
export class PortfolioModule {}
