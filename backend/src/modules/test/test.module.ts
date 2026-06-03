import { Module } from '@nestjs/common';
import { TestingController } from './test.controller';
import { TestingService } from './test.service';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [],
  controllers: [TestingController],
  providers: [TestingService, PrismaService],
})
export class TestingModule {}
