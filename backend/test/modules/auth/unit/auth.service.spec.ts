import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../../src/modules/auth/service/auth.service';
import { JwtService } from '@nestjs/jwt';
import { IAuthRepository } from '../../../../src/modules/auth/repository/auth.repository.interface';
import { CreateUserInput } from '../../../../src/modules/auth/input/create-user.input';
import { LoginInput } from '../../../../src/modules/auth/input/login.input';
import * as argon2 from 'argon2';
import { User } from '@prisma/client';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UserResponseDto } from '../../../../src/modules/public/dto/user-response.dto';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let authService: AuthService;
  let authRepository: IAuthRepository;
  let jwtService: JwtService;
  let memoryCost: number;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        {
          provide: 'AuthRepository',
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def: number): number => {
              return key === 'ARGON_MEMORY_COST' ? 4096 : def;
            }),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    authRepository = module.get<IAuthRepository>('AuthRepository');
    jwtService = module.get<JwtService>(JwtService);
    const configService = module.get<ConfigService>(ConfigService);
    memoryCost = configService.get('ARGON_MEMORY_COST', 4096);

    jest.spyOn(jwtService, 'sign').mockReturnValue('mockToken');
  });

  describe('register', () => {
    it('should return a token and user data', async () => {
      const input: CreateUserInput = {
        name: 'Juan',
        email: 'juan@gmail.com',
        password: 'secret',
      };

      const mockPrismaUser: User = {
        id: '1',
        name: 'Juan',
        email: 'juan@gmail.com',
        password: await argon2.hash('secret', {
          type: argon2.argon2id,
          memoryCost,
        }),
      };

      jest.spyOn(authRepository, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(authRepository, 'create').mockResolvedValue(mockPrismaUser);

      const result = await authService.register(input);

      const createSpy = jest.spyOn(authRepository, 'create');
      const signSpy = jest.spyOn(jwtService, 'sign');
      await authService.register(input);

      expect(createSpy).toHaveBeenCalled();
      expect(signSpy).toHaveBeenCalledWith({ sub: mockPrismaUser.id });
      expect(result.token).toBe('mockToken');
      expect(result.user.id).toBe(mockPrismaUser.id);
      expect(result.user).toBeInstanceOf(UserResponseDto);
    });

    it('should throw BadRequestException if email already exists', async () => {
      const input: CreateUserInput = {
        name: 'Juan',
        email: 'juan@gmail.com',
        password: 'secret',
      };

      const findByEmailSpy = jest
        .spyOn(authRepository, 'findByEmail')
        .mockResolvedValue({} as User);

      await expect(authService.register(input)).rejects.toThrow(
        BadRequestException,
      );
      expect(findByEmailSpy).toHaveBeenCalledWith(input.email);
    });
  });

  describe('login', () => {
    it('should return a token and user data with valid credentials', async () => {
      const input: LoginInput = { email: 'juan@gmail.com', password: 'secret' };
      const hashedPassword = await argon2.hash('secret', {
        type: argon2.argon2id,
        memoryCost,
      });

      const mockPrismaUser: User = {
        id: '1',
        name: 'Juan',
        email: 'juan@gmail.com',
        password: hashedPassword,
      };

      const findByEmailSpy = jest
        .spyOn(authRepository, 'findByEmail')
        .mockResolvedValue(mockPrismaUser);
      const signSpy = jest.spyOn(jwtService, 'sign');

      const result = await authService.login(input);

      expect(findByEmailSpy).toHaveBeenCalledWith(input.email);
      expect(signSpy).toHaveBeenCalled();
      expect(result.token).toBe('mockToken');
      expect(result.user).toBeInstanceOf(UserResponseDto);
    });

    it('should throw UnauthorizedException for non-existent email', async () => {
      const input: LoginInput = {
        email: 'noexiste@gmail.com',
        password: 'secret',
      };
      jest.spyOn(authRepository, 'findByEmail').mockResolvedValue(null);

      await expect(authService.login(input)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const input: LoginInput = { email: 'juan@gmail.com', password: 'wrong' };
      const hashedPassword = await argon2.hash('secret', {
        type: argon2.argon2id,
        memoryCost,
      });

      const mockPrismaUser: User = {
        id: '1',
        name: 'Juan',
        email: 'juan@gmail.com',
        password: hashedPassword,
      };

      jest
        .spyOn(authRepository, 'findByEmail')
        .mockResolvedValue(mockPrismaUser);

      await expect(authService.login(input)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
