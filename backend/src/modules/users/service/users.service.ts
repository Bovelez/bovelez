import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { DeleteAccountInput } from '../input/delete-account.input';
import type { IUsersRepository } from '../repository/users.repository.interface';
import type { ValidatedAuthenticatedUser } from '../validator/authenticated-user.validator';

@Injectable()
export class UsersService {
  constructor(
    @Inject('UsersRepository')
    private readonly usersRepository: IUsersRepository,
  ) {}

  async deleteOwnAccount(
    authenticatedUser: ValidatedAuthenticatedUser,
    input: DeleteAccountInput,
  ): Promise<void> {
    const user = await this.findExistingUser(authenticatedUser.id);
    await this.validateCurrentPassword(input.password, user.password);
    await this.deleteUser(user.id);
  }

  private async findExistingUser(userId: string): Promise<User> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  private async validateCurrentPassword(
    plainPassword: string,
    passwordHash: string,
  ): Promise<void> {
    const passwordMatches = await argon2.verify(passwordHash, plainPassword);

    if (!passwordMatches) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }
  }

  private async deleteUser(userId: string): Promise<void> {
    await this.usersRepository.deleteById(userId);
  }
}
