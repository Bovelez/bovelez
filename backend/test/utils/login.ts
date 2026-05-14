import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export const login = async (
  app: INestApplication,
  email: string,
  password: string,
) => {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200);
  return response.body;
};
