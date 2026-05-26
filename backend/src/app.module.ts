import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/public/guards/jwt-auth.guard';
import { UsersModule } from './modules/users/users.module';
import { PricesModule } from './modules/prices/prices.module';
import { EdgarModule } from './modules/edgar/edgar.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { WatchlistModule } from './modules/watchlist/watchlist.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, expandVariables: true }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    EdgarModule,
    TransactionsModule,
    PortfolioModule,
    PricesModule,
    WatchlistModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
