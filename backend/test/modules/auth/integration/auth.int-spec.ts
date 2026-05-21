import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../src/app.module';
import { PrismaClient } from '@prisma/client';
import { register } from '../../../utils/register';
import { login } from '../../../utils/login';
import { getHttpServer } from '../../../utils/http-server';

describe('Auth Integration', () => {
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

  it('(POST) /auth/register → should register a new user', async () => {
    const payload = {
      name: 'Juan',
      email: 'juan@email.com',
      password: '123456',
    };
    const response = await register(app, payload);

    expect(response.token).toBeDefined();
    expect(response.user.email).toBe(payload.email);
    expect(response.user.name).toBe(payload.name);
    expect('password' in response.user).toBe(false);
  });

  it('(POST) /auth/register → should fail if email is invalid', async () => {
    const response = await request(getHttpServer(app))
      .post('/auth/register')
      .send({
        name: 'Juan',
        email: 'not-an-email',
        password: '123456',
      })
      .expect(400);

    const body: unknown = response.body;
    expect((body as { message: string[] }).message).toContain(
      'email must be an email',
    );
  });

  it('(POST) /auth/register → should fail if email already in use', async () => {
    const response = await request(getHttpServer(app))
      .post('/auth/register')
      .send({
        name: 'Juan',
        email: 'juan@email.com',
        password: '123456',
      })
      .expect(400);

    const body: unknown = response.body;
    expect((body as { message: string }).message).toBe('Email already in use');
  });

  it('(POST) /auth/register → should fail if required fields are missing', async () => {
    const response = await request(getHttpServer(app))
      .post('/auth/register')
      .send({
        email: 'nuevo@email.com',
      })
      .expect(400);

    const body: unknown = response.body;
    const messages = (body as { message: string[] }).message;
    expect(messages).toContain('name should not be empty');
    expect(messages).toContain('password should not be empty');
  });

  it('(POST) /auth/login → should login an existing user', async () => {
    const response = await login(app, 'juan@email.com', '123456');

    expect(response.token).toBeDefined();
    expect(response.user).toBeDefined();
    expect(response.user.email).toBe('juan@email.com');
    expect(response.user.name).toBe('Juan');
    expect('password' in response.user).toBe(false);
  });

  it('(POST) /auth/login → should not login if invalid password', async () => {
    const response = await request(getHttpServer(app))
      .post('/auth/login')
      .send({
        email: 'juan@email.com',
        password: 'wrongpassword',
      })
      .expect(401);

    const body: unknown = response.body;
    expect((body as { message: string }).message).toBe('Invalid credentials');
  });

  it('(POST) /auth/login → should not login if email does not exist', async () => {
    const response = await request(getHttpServer(app))
      .post('/auth/login')
      .send({
        email: 'noexiste@email.com',
        password: '123456',
      })
      .expect(401);

    const body: unknown = response.body;
    expect((body as { message: string }).message).toBe('Invalid credentials');
  });

  it('(POST) /auth/login → should not login if email type and password type are invalid', async () => {
    const response = await request(getHttpServer(app))
      .post('/auth/login')
      .send({
        email: 'not-an-email',
        password: 123456,
      })
      .expect(400);

    const body: unknown = response.body;
    const messages = (body as { message: string[] }).message;
    expect(messages).toContain('email must be an email');
    expect(messages).toContain('password must be a string');
  });
});
