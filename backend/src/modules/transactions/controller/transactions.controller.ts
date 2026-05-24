import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../public/decorator/authenticated-user.decorator';
import { AuthenticatedUserValidator } from '../../users/validator/authenticated-user.validator';
import type { ValidatedAuthenticatedUser } from '../../users/validator/authenticated-user.validator';
import { TransactionDto } from '../dto/transaction.dto';
import { BuyTransactionInput } from '../input/buy-transaction.input';
import { SellTransactionInput } from '../input/sell-transaction.input';
import { TransactionsService } from '../service/transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('buy')
  @HttpCode(HttpStatus.CREATED)
  buy(
    @AuthenticatedUser(new AuthenticatedUserValidator())
    authenticatedUser: ValidatedAuthenticatedUser,
    @Body() input: BuyTransactionInput,
  ): Promise<TransactionDto> {
    return this.transactionsService.buy(authenticatedUser.id, input);
  }

  @Post('sell')
  @HttpCode(HttpStatus.CREATED)
  sell(
    @AuthenticatedUser(new AuthenticatedUserValidator())
    authenticatedUser: ValidatedAuthenticatedUser,
    @Body() input: SellTransactionInput,
  ): Promise<TransactionDto> {
    return this.transactionsService.sell(authenticatedUser.id, input);
  }

  @Get(':ticker')
  getTickerTransactionsByTicker(
    @AuthenticatedUser(new AuthenticatedUserValidator())
    authenticatedUser: ValidatedAuthenticatedUser,
    @Param('ticker') ticker: string,
  ): Promise<TransactionDto[]> {
    return this.transactionsService.getTransactionsByTicker(
      authenticatedUser.id,
      ticker,
    );
  }

  @Get()
  getTickerTransactionsByTickerById(
    @AuthenticatedUser(new AuthenticatedUserValidator())
    @AuthenticatedUser(new AuthenticatedUserValidator())
    authenticatedUser: ValidatedAuthenticatedUser,
  ): Promise<TransactionDto[]> {
    return this.transactionsService.getTransactionsByUserId(
      authenticatedUser.id,
    );
  }
}
