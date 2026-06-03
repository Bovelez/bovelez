import { Controller, Get, HttpCode, Post, ForbiddenException } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { TestingService } from './test.service';

@Controller('test')
export class TestingController {
  constructor(private readonly testingService: TestingService) {}

  @Public()
  @Get('health')
  health() {
    this.guardTestEnv();
    return {
      env: process.env.NODE_ENV,
      db: process.env.DATABASE_URL,
    };
  }

  @Public()
  @HttpCode(200)
  @Post('reset')
  async reset() {
    this.guardTestEnv();
    await this.testingService.resetAndSeed();
    return { ok: true };
  }

  private guardTestEnv() {
    if (process.env.NODE_ENV !== 'test') {
      throw new ForbiddenException(
        'Este endpoint solo está disponible en NODE_ENV=test',
      );
    }
  }
}
