import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UsersController } from './controller/users.controller';
import { UsersRepository } from './repository/users.repository';
import { UsersService } from './service/users.service';

@Module({
  controllers: [UsersController],
  providers: [
    PrismaService,
    { provide: 'UsersRepository', useClass: UsersRepository },
    UsersService,
  ],
  exports: [UsersService, 'UsersRepository'],
})
export class UsersModule {}
