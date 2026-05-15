import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { IUsersRepository } from '../../../../src/modules/users/repository/users.repository.interface';
import { UsersService } from '../../../../src/modules/users/service/users.service';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: IUsersRepository;
  let findById: jest.MockedFunction<IUsersRepository['findById']>;
  let deleteById: jest.MockedFunction<IUsersRepository['deleteById']>;

  beforeEach(() => {
    findById = jest.fn();
    deleteById = jest.fn();
    usersRepository = {
      findById,
      deleteById,
    };
    service = new UsersService(usersRepository);
  });

  it('deletes the account when the current password is correct', async () => {
    const user = await buildUser('Password1!');
    findById.mockResolvedValue(user);

    await service.deleteOwnAccount(
      { id: 'user-1' },
      { password: 'Password1!' },
    );

    expect(findById).toHaveBeenCalledWith('user-1');
    expect(deleteById).toHaveBeenCalledWith('user-1');
  });

  it('throws UnauthorizedException when the password is incorrect', async () => {
    const user = await buildUser('Password1!');
    findById.mockResolvedValue(user);

    await expect(
      service.deleteOwnAccount(
        { id: 'user-1' },
        { password: 'WrongPassword1!' },
      ),
    ).rejects.toThrow(UnauthorizedException);
    expect(deleteById).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the authenticated user no longer exists', async () => {
    findById.mockResolvedValue(null);

    await expect(
      service.deleteOwnAccount(
        { id: 'missing-user' },
        { password: 'Password1!' },
      ),
    ).rejects.toThrow(NotFoundException);
    expect(deleteById).not.toHaveBeenCalled();
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
