import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';
import { PricesService } from '../service/prices.service';
import { Public } from '../../auth/decorators/public.decorator';

class UpdatePricesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tickers!: string[];
}

@Public()
@Controller('prices')
export class PricesController {
  constructor(private readonly service: PricesService) {}

  @Post('update')
  update(@Body() dto: UpdatePricesDto) {
    return this.service.runBatch(dto.tickers);
  }

  @Get('last-run')
  lastRun() {
    return this.service.getLastBatchRun();
  }

  @Get()
  getAll() {
    return this.service.getAllPrices();
  }

  @Get(':ticker')
  async getOne(@Param('ticker') ticker: string) {
    const price = await this.service.getPrice(ticker);
    if (!price)
      throw new NotFoundException(`No price found for ticker ${ticker}`);
    return price;
  }
}
