import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../public/decorator/authenticated-user.decorator';
import { AuthenticatedUserValidator } from '../../users/validator/authenticated-user.validator';
import type { ValidatedAuthenticatedUser } from '../../users/validator/authenticated-user.validator';
import { CreatePositionInput } from '../input/create-position.input';
import { DeletePositionInput } from '../input/delete-position.input';
import { UpdatePositionInput } from '../input/update-position.input';
import { PortfolioDto } from '../dto/portfolio.dto';
import { PositionDto } from '../dto/position.dto';
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

  @Post('positions')
  @HttpCode(HttpStatus.CREATED)
  addPosition(
    @AuthenticatedUser(new AuthenticatedUserValidator())
    authenticatedUser: ValidatedAuthenticatedUser,
    @Body() input: CreatePositionInput,
  ): Promise<PositionDto> {
    return this.portfolioService.addPosition(authenticatedUser.id, input);
  }

  @Get('positions/:id')
  getPosition(
    @AuthenticatedUser(new AuthenticatedUserValidator())
    authenticatedUser: ValidatedAuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PositionDto> {
    return this.portfolioService.getPosition(authenticatedUser.id, id);
  }

  @Put('positions/:id')
  updatePosition(
    @AuthenticatedUser(new AuthenticatedUserValidator())
    authenticatedUser: ValidatedAuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: UpdatePositionInput,
  ): Promise<PositionDto> {
    return this.portfolioService.updatePosition(
      authenticatedUser.id,
      id,
      input,
    );
  }

  @Delete('positions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePosition(
    @AuthenticatedUser(new AuthenticatedUserValidator())
    authenticatedUser: ValidatedAuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: DeletePositionInput,
  ): Promise<void> {
    await this.portfolioService.deletePosition(
      authenticatedUser.id,
      id,
      input.quantity,
    );
  }
}
