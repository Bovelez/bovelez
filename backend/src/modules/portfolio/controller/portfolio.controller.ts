import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../public/decorator/authenticated-user.decorator';
import { AuthenticatedUserValidator } from '../../users/validator/authenticated-user.validator';
import type { ValidatedAuthenticatedUser } from '../../users/validator/authenticated-user.validator';
import { BuyPositionInput } from '../input/buy-position.input';
import { SellPositionInput } from '../input/sell-position.input';
import { PortfolioDto } from '../dto/portfolio.dto';
import { TransactionDto } from '../dto/transaction.dto';
import { PortfolioService } from '../service/portfolio.service';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  getPortfolio(
    @AuthenticatedUser(new AuthenticatedUserValidator())
    authenticatedUser: ValidatedAuthenticatedUser,
  ): Promise<PortfolioDto> {
    return this.portfolioService.getPortfolio(authenticatedUser.id);
  }

  @Post('buy')
  @HttpCode(HttpStatus.CREATED)
  buy(
    @AuthenticatedUser(new AuthenticatedUserValidator())
    authenticatedUser: ValidatedAuthenticatedUser,
    @Body() input: BuyPositionInput,
  ): Promise<TransactionDto> {
    return this.portfolioService.buy(authenticatedUser.id, input);
  }

  @Post('sell')
  @HttpCode(HttpStatus.CREATED)
  sell(
    @AuthenticatedUser(new AuthenticatedUserValidator())
    authenticatedUser: ValidatedAuthenticatedUser,
    @Body() input: SellPositionInput,
  ): Promise<TransactionDto> {
    return this.portfolioService.sell(authenticatedUser.id, input);
  }
}
