import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { LoginDto } from '../../src/modules/auth/dto/login.dto';
import { getHttpServer } from './http-server';

export const login = async (
  app: INestApplication,
  email: string,
  password: string,
): Promise<LoginDto> => {
  const response = await request(getHttpServer(app))
    .post('/auth/login')
    .send({ email, password })
    .expect(200);
  const body: unknown = response.body;
  return body as LoginDto;
};
