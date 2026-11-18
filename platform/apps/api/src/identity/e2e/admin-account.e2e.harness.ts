// E2E harness T-4411: Nest app + Mem-провайдери для admin account lifecycle.
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { IdentityModule } from '../infrastructure/identity.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PrismaUserRepository } from '../infrastructure/prisma-adapters';
import { PrismaSessionRepository } from '../infrastructure/prisma-session-repository';
import { PrismaOutboxPublisher } from '../infrastructure/prisma-outbox-publisher';
import { PrismaLoginAudit } from '../infrastructure/prisma-login-audit';
import { hashPassword } from '../domain/password';
import { PhoneNumber } from '../domain/phone-number';
import { User } from '../domain/user';
import { MemLoginAudit, MemSessions, MemUsers } from './admin-client-otp.fakes';

export const ACCOUNT_NOW = new Date('2026-09-27T10:00:00.000Z');

export async function createAdminAccountApp(): Promise<{
  app: INestApplication;
  users: MemUsers;
  sessions: MemSessions;
}> {
  const users = new MemUsers();
  const sessions = new MemSessions();
  const moduleRef: TestingModule = await Test.createTestingModule({ imports: [IdentityModule] })
    .overrideProvider(PrismaService)
    .useValue({
      $connect: () => undefined,
      $disconnect: () => undefined,
      $transaction: async <T>(work: () => Promise<T>): Promise<T> => work(),
    })
    .overrideProvider(PrismaUserRepository)
    .useValue(users)
    .overrideProvider(PrismaSessionRepository)
    .useValue(sessions)
    .overrideProvider(PrismaOutboxPublisher)
    .useValue({ append: async () => undefined })
    .overrideProvider(PrismaLoginAudit)
    .useValue(new MemLoginAudit())
    .compile();
  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  await app.init();
  return { app, users, sessions };
}

export function seedAdmin(users: MemUsers, id: string, password: string | null) {
  users.store.set(
    id,
    User.create({
      id,
      phone: PhoneNumber.of('+380501234567'),
      role: 'admin',
      name: id,
      active: true,
      selfSchedule: false,
      username: id,
      passwordHash: password ? hashPassword(password) : null,
      createdAt: ACCOUNT_NOW,
    })
  );
}

export const loginAs = async (
  app: INestApplication,
  id: string,
  password: string
): Promise<string> => {
  const res = await request(app.getHttpServer())
    .post('/admin/auth/login')
    .send({ username: id, password })
    .expect(200);
  const setCookie = res.headers['set-cookie'] ?? [];
  return ((Array.isArray(setCookie) ? setCookie[0] : setCookie) ?? '').split(';')[0] ?? '';
};
