import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EdgarModule } from '../edgar/edgar.module';
import { PortfolioController } from './controller/portfolio.controller';
import { PortfolioRepository } from './repository/portfolio.repository';
import { PortfolioService } from './service/portfolio.service';

@Module({
  imports: [EdgarModule],
  controllers: [PortfolioController],
  providers: [
    PrismaService,
    { provide: 'PortfolioRepository', useClass: PortfolioRepository },
    PortfolioService,
  ],
  exports: [PortfolioService],
})
export class PortfolioModule {}
