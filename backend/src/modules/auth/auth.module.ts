import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './service/auth.service';
import { AuthController } from './controller/auth.controller';
import { AuthRepository } from './repository/auth.repository';
import { JwtStrategy } from '../public/strategies/jwt.strategy';
import { JwtAuthGuard } from '../public/guards/jwt-auth.guard';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '1h',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    PrismaService,
    { provide: 'AuthRepository', useClass: AuthRepository },
    AuthService,
    JwtStrategy,
    { provide: 'JwtAuthGuard', useClass: JwtAuthGuard },
  ],
  exports: [AuthService, 'AuthRepository', 'JwtAuthGuard', JwtModule],
})
export class AuthModule {}
