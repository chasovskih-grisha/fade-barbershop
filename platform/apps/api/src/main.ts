// OTel SDK — найперший імпорт (T-4204f): auto-instrumentations мусять обгорнути
// http/express/ioredis ДО їх завантаження застосунком.
import './otel';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { DailyFileLogger } from './shared/logging/daily-file.logger';
import { SESSION_COOKIE_NAME } from './identity/infrastructure/session-cookie';
import { setupOpenApi } from './shared/openapi/openapi';

const logger = new DailyFileLogger(join(process.cwd(), 'var', 'logs'));

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger });
  app.use(cookieParser());
  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:13001';
  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
      exposedHeaders: ['Set-Cookie'],
    })
  );
  // OpenAPI (T-4607): /docs — Swagger UI, /docs.json — специфікація
  // (+ /openapi та /openapi.json). Монтуємо до listen, щоб маршрути існували
  // з першого запиту. Назву cookie беремо з identity — тут лише передаємо її
  // в документ, щоб shared-шар не імпортував фічу.
  setupOpenApi(app, SESSION_COOKIE_NAME);
  await app.listen(Number(process.env.API_PORT ?? 13000));
}
bootstrap().catch((error: unknown) => {
  logger.error('API bootstrap failed', error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
