import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../public/decorator/authenticated-user.decorator';
import { AuthenticatedUserValidator } from '../../users/validator/authenticated-user.validator';
import type { ValidatedAuthenticatedUser } from '../../users/validator/authenticated-user.validator';
import { WatchlistService } from '../service/watchlist.service';
import { AddWatchlistItemDto } from '../dto/add-watchlist-item.dto';
import { CompareMetricsDto } from '../dto/compare-metrics.dto';

@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly service: WatchlistService) {}

  @Get()
  getItems(
    @AuthenticatedUser(new AuthenticatedUserValidator())
    authenticatedUser: ValidatedAuthenticatedUser,
  ) {
    return this.service.getItems(authenticatedUser.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  addItem(
    @AuthenticatedUser(new AuthenticatedUserValidator())
    authenticatedUser: ValidatedAuthenticatedUser,
    @Body() body: AddWatchlistItemDto,
  ) {
    return this.service.addItem(authenticatedUser.id, body.ticker);
  }

  @Delete(':ticker')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeItem(
    @AuthenticatedUser(new AuthenticatedUserValidator())
    authenticatedUser: ValidatedAuthenticatedUser,
    @Param('ticker') ticker: string,
  ) {
    return this.service.removeItem(authenticatedUser.id, ticker);
  }

  @Post('compare')
  compareMetrics(
    @AuthenticatedUser(new AuthenticatedUserValidator())
    authenticatedUser: ValidatedAuthenticatedUser,
    @Body() body: CompareMetricsDto,
  ) {
    return this.service.compareMetrics(authenticatedUser.id, body.tickers);
  }
}
