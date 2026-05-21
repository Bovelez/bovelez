import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/public/guards/jwt-auth.guard';
import { UsersModule } from './modules/users/users.module';
import { EdgarModule } from './modules/edgar/edgar.module';
import { PricesModule } from './modules/prices/prices.module';
import { EdgarModule } from './modules/edgar/edgar.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, expandVariables: true }),
    AuthModule,
    UsersModule,
    EdgarModule,
    PortfolioModule,
    EdgarModule,
    PricesModule,
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
