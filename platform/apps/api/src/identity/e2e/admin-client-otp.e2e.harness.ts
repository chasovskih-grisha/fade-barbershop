// E2E harness T-4409: Nest app + Mem-провайдери для admin client OTP.
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { IdentityModule } from '../infrastructure/identity.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { MemProfiles } from '../../crm/e2e/admin-clients.fakes';
import { PrismaOtpChallengeRepository, PrismaUserRepository } from '../infrastructure/prisma-adapters';
import { PrismaClientProfileRepository } from '../../crm/infrastructure/prisma-client-profile.repository';
import { PrismaSessionRepository } from '../infrastructure/prisma-session-repository';
import { PrismaOutboxPublisher } from '../infrastructure/prisma-outbox-publisher';
import { PrismaLoginAudit } from '../infrastructure/prisma-login-audit';
import { OtpSenderFactory } from '../infrastructure/otp-sender.factory';
import { hashPassword } from '../domain/password';
import { hashToken } from '../domain/otp-code';
import { PhoneNumber } from '../domain/phone-number';
import { User } from '../domain/user';
import { Session } from '../domain/session';
import { SESSION_COOKIE_NAME } from '../infrastructure/session-cookie';
import { CapturingSender, MemChallenges, MemSessions, MemUsers } from './admin-client-otp.fakes';
import { testId } from '../application/test-ids';

export const ADMIN_ID = testId();
export const CLIENT_ID = testId();

export const CLIENT_OTP_NOW = new Date('2026-09-27T10:00:00.000Z');
export const CLIENT_OTP_COOKIE = `${SESSION_COOKIE_NAME}=admin-token-1`;
export const CLIENT_OTP_PHONE = '+380501114446';

export async function createAdminClientOtpApp(): Promise<{
  app: INestApplication;
  users: MemUsers;
  sessions: MemSessions;
  challenges: MemChallenges;
  sender: CapturingSender;
  profiles: MemProfiles;
}> {
  const users = new MemUsers();
  const sessions = new MemSessions();
  const challenges = new MemChallenges();
  const sender = new CapturingSender();
  const profiles = new MemProfiles();
  const moduleRef: TestingModule = await Test.createTestingModule({ imports: [IdentityModule] })
    .overrideProvider(PrismaService)
    .useValue({
      $connect: () => undefined,
      $disconnect: () => undefined,
      $transaction: async <T>(work: () => Promise<T>): Promise<T> => work(),
    })
    .overrideProvider(PrismaUserRepository)
    .useValue(users)
    .overrideProvider(PrismaClientProfileRepository)
    .useValue(profiles)
    .overrideProvider(PrismaOtpChallengeRepository)
    .useValue(challenges)
    .overrideProvider(PrismaSessionRepository)
    .useValue(sessions)
    .overrideProvider(PrismaLoginAudit)
    .useValue({ record: async () => undefined, list: async () => [] })
    .overrideProvider(PrismaOutboxPublisher)
    .useValue({ append: async () => undefined })
    .overrideProvider(OtpSenderFactory)
    .useValue({ build: () => sender })
    .compile();
  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  await app.init();

  // Адмін з валідною admin-сесією (guard: канал admin + роль admin).
  users.save(
    User.create({
      id: ADMIN_ID,
      phone: PhoneNumber.of('+380501234567'),
      role: 'admin',
      username: 'owner',
      passwordHash: hashPassword('FadeSecret2026'),
      createdAt: CLIENT_OTP_NOW,
    })
  );
  sessions.save(
    Session.issue({
      id: testId(),
      userId: ADMIN_ID,
      channel: 'admin',
      tokenHash: hashToken('admin-token-1'),
      refreshTokenHash: null,
      previousRefreshHash: null,
      accessExpiresAt: null,
      refreshExpiresAt: null,
      createdAt: CLIENT_OTP_NOW,
    })
  );
  return { app, users, sessions, challenges, sender, profiles };
}
