import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CreateUserInput } from '../../src/modules/auth/input/create-user.input';
import { UserResponseDto } from '../../src/modules/public/dto/user-response.dto';
import { getHttpServer } from './http-server';

export const register = async (
  app: INestApplication,
  payload: CreateUserInput,
): Promise<UserResponseDto> => {
  const response = await request(getHttpServer(app))
    .post('/auth/register')
    .send(payload)
    .expect(201);
  const body: unknown = response.body;
  return body as UserResponseDto;
};
