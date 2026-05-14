import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { UsersController } from '../../../../src/modules/users/controller/users.controller';
import { DeleteAccountInput } from '../../../../src/modules/users/input/delete-account.input';
import { UsersService } from '../../../../src/modules/users/service/users.service';

type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
  };
};

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: Pick<UsersService, 'deleteOwnAccount'>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            deleteOwnAccount: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  it('deletes the authenticated user account', async () => {
    const input: DeleteAccountInput = { password: 'Password1!' };
    const request = { user: { id: 'user-1' } } as AuthenticatedRequest;

    await controller.deleteMe(request, input);

    expect(usersService.deleteOwnAccount).toHaveBeenCalledWith('user-1', input);
  });

  it('does not accept a request without an authenticated user id', async () => {
    const input: DeleteAccountInput = { password: 'Password1!' };
    const request = { user: {} } as AuthenticatedRequest;

    await expect(controller.deleteMe(request, input)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(usersService.deleteOwnAccount).not.toHaveBeenCalled();
  });
});
