import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { DeleteAccountInput } from '../input/delete-account.input';
import { IUsersRepository } from '../repository/users.repository.interface';

@Injectable()
export class UsersService {
  constructor(
    @Inject('UsersRepository')
    private readonly usersRepository: IUsersRepository,
  ) {}

  async deleteOwnAccount(
    userId: string,
    input: DeleteAccountInput,
  ): Promise<void> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordMatches = await argon2.verify(user.password, input.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid password');
    }

    await this.usersRepository.deleteById(user.id);
  }
}
