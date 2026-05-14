import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IAuthRepository } from './auth.repository.interface';
import { CreateUserInput } from '../input/create-user.input';
import { User } from '@prisma/client';

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(private prismaService: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prismaService.user.findUnique({ where: { id: id } });
  }

  async create(user: CreateUserInput): Promise<User> {
    return this.prismaService.user.create({
      data: {
        email: user.email,
        name: user.name,
        password: user.password,
      },
    });
  }
  async findByEmail(email: string): Promise<User | null> {
    return this.prismaService.user.findUnique({ where: { email } });
  }
}
