// E2E harness: адмін-вхід (T-013 / T-4411).
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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
import { uuidv7 } from '@fade/domain-shared';

export const ADMIN_LOGIN_NOW = new Date('2026-09-21T10:00:00.000Z');

export async function createAdminLoginApp(): Promise<{
  app: INestApplication;
  users: MemUsers;
  sessions: MemSessions;
  audit: MemLoginAudit;
}> {
  const users = new MemUsers();
  const sessions = new MemSessions();
  const audit = new MemLoginAudit();
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
    .useValue(audit)
    .compile();
  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  await app.init();
  return { app, users, sessions, audit };
}

export function seedAdminLogin(
  users: MemUsers,
  args: { username: string; password: string; role: 'admin' | 'client' }
): User {
  const user = User.create({
    id: uuidv7(),
    phone: PhoneNumber.of('+380501234567'),
    role: args.role,
    username: args.username,
    passwordHash: hashPassword(args.password),
    createdAt: ADMIN_LOGIN_NOW,
  });
  users.save(user);
  return user;
}
