import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { IAuthRepository } from '../repository/auth.repository.interface';
import { JwtService } from '@nestjs/jwt';
import { CreateUserInput } from '../input/create-user.input';
import { LoginInput } from '../input/login.input';
import { LoginDto } from '../dto/login.dto';
import * as argon2 from 'argon2';
import { ConfigService } from '@nestjs/config';
import { UserResponseDto } from '../../public/dto/user-response.dto';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    @Inject('AuthRepository')
    private readonly authRepository: IAuthRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.authRepository.findById(id);
    if (!user) throw new UnauthorizedException('Usuario autenticado inválido');
    return this.getUserResponse(user);
  }
  private async isEmailInUse(email: string): Promise<void> {
    if (await this.authRepository.findByEmail(email)) {
      throw new BadRequestException('Email already in use');
    }
  }
  async register(createUserInput: CreateUserInput): Promise<UserResponseDto> {
    await this.isEmailInUse(createUserInput.email);
    createUserInput.password = await this.hashPassword(
      createUserInput.password,
    );
    const user = await this.authRepository.create(createUserInput);
    return this.getUserResponse(user);
  }
  private async hashPassword(password: string | undefined): Promise<string> {
    if (!password) throw new BadRequestException('Password is required');
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: this.configService.get<number>('ARGON_MEMORY_COST', 65536),
      timeCost: this.configService.get<number>('ARGON_TIME_COST', 3),
      parallelism: this.configService.get<number>('ARGON_PARALLELISM', 2),
    });
  }

  private async comparePasswords(
    plainTextPassword: string | undefined,
    hashedPassword: string | undefined,
  ): Promise<boolean> {
    if (!plainTextPassword || !hashedPassword) return false;
    return await argon2.verify(hashedPassword, plainTextPassword);
  }

  async login(credentials: LoginInput): Promise<LoginDto> {
    const user = await this.authRepository.findByEmail(credentials.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordsMatch = await this.comparePasswords(
      credentials.password,
      user.password,
    );

    if (!passwordsMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id };
    const token = this.jwtService.sign(payload);
    return new LoginDto(token, this.getUserResponse(user));
  }
  private getUserResponse(user: User): UserResponseDto {
    return new UserResponseDto(user.id, user.name, user.email);
  }
}
