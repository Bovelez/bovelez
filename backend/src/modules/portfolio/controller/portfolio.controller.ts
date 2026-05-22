import { Controller, Get } from '@nestjs/common';
import { AuthenticatedUser } from '../../public/decorator/authenticated-user.decorator';
import { AuthenticatedUserValidator } from '../../users/validator/authenticated-user.validator';
import type { ValidatedAuthenticatedUser } from '../../users/validator/authenticated-user.validator';
import { PortfolioDto } from '../dto/portfolio.dto';
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
}
