import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export type TestHttpServer = Parameters<typeof request>[0];

export function getHttpServer(app: INestApplication): TestHttpServer {
  return app.getHttpServer() as TestHttpServer;
}
