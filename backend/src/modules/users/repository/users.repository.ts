import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IUsersRepository } from './users.repository.interface';
import { User } from '@prisma/client';

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(private prismaService: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prismaService.user.findUnique({ where: { id } });
  }

  async deleteById(id: string): Promise<void> {
    await this.prismaService.$transaction(async (tx) => {
      // Keep account deletion isolated here so portfolio, transactions and
      // watchlist cleanup can be added when those models exist.
      await tx.user.delete({ where: { id } });
    });
  }
}
