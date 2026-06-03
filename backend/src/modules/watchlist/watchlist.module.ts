import { Module } from '@nestjs/common';
import { WatchlistController } from './controller/watchlist.controller';
import { WatchlistService } from './service/watchlist.service';
import { WatchlistRepository } from './repository/watchlist.repository';
import { PrismaService } from '../database/prisma.service';
import { EdgarModule } from '../edgar/edgar.module';
import { WATCHLIST_REPOSITORY } from './repository/watchlist.repository.interface';
import { PricesModule } from '../prices/prices.module';

@Module({
  imports: [EdgarModule, PricesModule],
  controllers: [WatchlistController],
  providers: [
    WatchlistService,
    PrismaService,
    { provide: WATCHLIST_REPOSITORY, useClass: WatchlistRepository },
  ],
  exports: [WatchlistService],
})
export class WatchlistModule {}
