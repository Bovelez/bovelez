import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CreateUserInput } from '../../src/modules/auth/input/create-user.input';
import { LoginDto } from '../../src/modules/auth/dto/login.dto';
import { getHttpServer } from './http-server';

export const register = async (
  app: INestApplication,
  payload: CreateUserInput,
): Promise<LoginDto> => {
  const response = await request(getHttpServer(app))
    .post('/auth/register')
    .send(payload)
    .expect(201);
  const body: unknown = response.body;
  return body as LoginDto;
};
