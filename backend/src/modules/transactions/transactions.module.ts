import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EdgarModule } from '../edgar/edgar.module';
import { PricesModule } from '../prices/prices.module';
import { TransactionsController } from './controller/transactions.controller';
import { TransactionsRepository } from './repository/transactions.repository';
import { TransactionsService } from './service/transactions.service';

@Module({
  imports: [EdgarModule, PricesModule],
  controllers: [TransactionsController],
  providers: [
    PrismaService,
    { provide: 'TransactionsRepository', useClass: TransactionsRepository },
    TransactionsService,
  ],
  exports: [TransactionsService],
})
export class TransactionsModule {}
