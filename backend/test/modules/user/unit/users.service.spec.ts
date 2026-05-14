import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { IUsersRepository } from '../../../../src/modules/users/repository/users.repository.interface';
import { UsersService } from '../../../../src/modules/users/service/users.service';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: IUsersRepository;

  beforeEach(() => {
    usersRepository = {
      findById: jest.fn(),
      deleteById: jest.fn(),
    };
    service = new UsersService(usersRepository);
  });

  it('deletes the account when the current password is correct', async () => {
    const user = await buildUser('Password1!');
    jest.spyOn(usersRepository, 'findById').mockResolvedValue(user);

    await service.deleteOwnAccount('user-1', { password: 'Password1!' });

    expect(usersRepository.findById).toHaveBeenCalledWith('user-1');
    expect(usersRepository.deleteById).toHaveBeenCalledWith('user-1');
  });

  it('throws UnauthorizedException when the password is incorrect', async () => {
    const user = await buildUser('Password1!');
    jest.spyOn(usersRepository, 'findById').mockResolvedValue(user);

    await expect(
      service.deleteOwnAccount('user-1', { password: 'WrongPassword1!' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(usersRepository.deleteById).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the authenticated user no longer exists', async () => {
    jest.spyOn(usersRepository, 'findById').mockResolvedValue(null);

    await expect(
      service.deleteOwnAccount('missing-user', { password: 'Password1!' }),
    ).rejects.toThrow(NotFoundException);
    expect(usersRepository.deleteById).not.toHaveBeenCalled();
  });
});

async function buildUser(password: string): Promise<User> {
  return {
    id: 'user-1',
    name: 'Juan',
    email: 'juan@email.com',
    password: await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 4096,
    }),
  };
}
