import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../src/app.module';
import { PrismaClient } from '@prisma/client';
import { register } from '../../../utils/register';
import { login } from '../../../utils/login';
import { getHttpServer } from '../../../utils/http-server';

describe('Users Integration', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = new PrismaClient();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany();
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  it('(DELETE) /users/me → deletes the authenticated account and invalidates the token', async () => {
    await register(app, {
      name: 'Juan',
      email: 'juan@email.com',
      password: 'Password1!',
    });
    const loginResponse = await login(app, 'juan@email.com', 'Password1!');

    await request(getHttpServer(app))
      .delete('/users/me')
      .set('Authorization', `Bearer ${loginResponse.token}`)
      .send({ password: 'Password1!' })
      .expect(204);

    const deletedUser = await prisma.user.findUnique({
      where: { email: 'juan@email.com' },
    });
    expect(deletedUser).toBeNull();

    await request(getHttpServer(app))
      .post('/auth/login')
      .send({ email: 'juan@email.com', password: 'Password1!' })
      .expect(401);

    await request(getHttpServer(app))
      .delete('/users/me')
      .set('Authorization', `Bearer ${loginResponse.token}`)
      .send({ password: 'Password1!' })
      .expect(401);
  });

  it('(DELETE) /users/me → rejects unauthenticated requests', async () => {
    await request(getHttpServer(app))
      .delete('/users/me')
      .send({ password: 'Password1!' })
      .expect(401);
  });

  it('(DELETE) /users/me → rejects an incorrect password without deleting the account', async () => {
    await register(app, {
      name: 'Juan',
      email: 'juan@email.com',
      password: 'Password1!',
    });
    const loginResponse = await login(app, 'juan@email.com', 'Password1!');

    const response = await request(getHttpServer(app))
      .delete('/users/me')
      .set('Authorization', `Bearer ${loginResponse.token}`)
      .send({ password: 'WrongPassword1!' })
      .expect(401);

    expect((response.body as { message: string }).message).toBe(
      'Contraseña incorrecta',
    );
    const existingUser = await prisma.user.findUnique({
      where: { email: 'juan@email.com' },
    });
    expect(existingUser).not.toBeNull();
  });

  it('(DELETE) /users/me → validates password is required', async () => {
    await register(app, {
      name: 'Juan',
      email: 'juan@email.com',
      password: 'Password1!',
    });
    const loginResponse = await login(app, 'juan@email.com', 'Password1!');

    const response = await request(getHttpServer(app))
      .delete('/users/me')
      .set('Authorization', `Bearer ${loginResponse.token}`)
      .send({})
      .expect(400);

    expect((response.body as { message: string[] }).message).toContain(
      'password should not be empty',
    );
  });

  it('(DELETE) /users/me → only deletes the authenticated user', async () => {
    await register(app, {
      name: 'Juan',
      email: 'juan@email.com',
      password: 'Password1!',
    });
    await register(app, {
      name: 'Ana',
      email: 'ana@email.com',
      password: 'Password1!',
    });
    const loginResponse = await login(app, 'juan@email.com', 'Password1!');

    await request(getHttpServer(app))
      .delete('/users/me')
      .set('Authorization', `Bearer ${loginResponse.token}`)
      .send({ password: 'Password1!' })
      .expect(204);

    const deletedUser = await prisma.user.findUnique({
      where: { email: 'juan@email.com' },
    });
    const otherUser = await prisma.user.findUnique({
      where: { email: 'ana@email.com' },
    });

    expect(deletedUser).toBeNull();
    expect(otherUser).not.toBeNull();
  });
});
