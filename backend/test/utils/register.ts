import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export const register = async (app: INestApplication, payload: object) => {
  const response = await request(app.getHttpServer())
    .post('/auth/register')
    .send(payload)
    .expect(201);
  return response.body;
};
