// E2E harness зміни номера клієнта (T-4620a): Nest app + Mem-провайдери, за
// схемою інших identity/e2e-спеків. Клієнт має ДВІ web-сесії, щоб перевірити
// ревок «інших» і живість поточної (Risks: stolen session). Mem-сесії — в
// окремому change-phone.e2e.mem.ts (max-lines).
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { IdentityModule } from '../infrastructure/identity.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PrismaClientProfileRepository } from '../../crm/infrastructure/prisma-client-profile.repository';
import { MemProfiles } from '../../crm/e2e/admin-clients.fakes';
import {
  PrismaOtpChallengeRepository,
  PrismaUserRepository,
} from '../infrastructure/prisma-adapters';
import { PrismaSessionRepository } from '../infrastructure/prisma-session-repository';
import { PrismaOutboxPublisher } from '../infrastructure/prisma-outbox-publisher';
import { PrismaLoginAudit } from '../infrastructure/prisma-login-audit';
import { OtpSenderFactory } from '../infrastructure/otp-sender.factory';
import { hashOtpCode, hashToken } from '../domain/otp-code';
import { OtpChallenge } from '../domain/otp-challenge';
import { PhoneNumber } from '../domain/phone-number';
import { User } from '../domain/user';
import { Session } from '../domain/session';
import { SESSION_COOKIE_NAME } from '../infrastructure/session-cookie';
import { CapturingSender, MemChallenges, MemUsers } from './admin-client-otp.fakes';
import { MemClientSessions } from './change-phone.e2e.mem';
import { testId } from '../application/test-ids';

export const OLD_PHONE = '+380501110001';
export const NEW_PHONE = '+380501110002';
export const OTHER_PHONE = '+380501110003';

export interface ChangePhoneApp {
  app: INestApplication;
  users: MemUsers;
  sessions: MemClientSessions;
  challenges: MemChallenges;
  sender: CapturingSender;
}

export async function createChangePhoneApp(): Promise<ChangePhoneApp> {
  const users = new MemUsers();
  const sessions = new MemClientSessions();
  const challenges = new MemChallenges();
  const sender = new CapturingSender();
  const moduleRef: TestingModule = await Test.createTestingModule({ imports: [IdentityModule] })
    .overrideProvider(PrismaService)
    .useValue({
      $connect: () => undefined,
      $disconnect: () => undefined,
      $transaction: async <T>(work: () => Promise<T>) => work(),
    })
    .overrideProvider(PrismaUserRepository)
    .useValue(users)
    .overrideProvider(PrismaOtpChallengeRepository)
    .useValue(challenges)
    .overrideProvider(PrismaSessionRepository)
    .useValue(sessions)
    .overrideProvider(PrismaClientProfileRepository)
    .useValue(new MemProfiles())
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
  return { app, users, sessions, challenges, sender };
}

/** Клієнт з телефоном phone і web-сесіями за токенами (перший — поточний). */
export function seedClient(ctx: ChangePhoneApp, phone: string, tokens: string[]): string {
  const id = testId();
  const now = new Date();
  ctx.users.save(User.create({ id, phone: PhoneNumber.of(phone), role: 'client', createdAt: now }));
  for (const token of tokens) {
    ctx.sessions.save(
      Session.issue({
        id: testId(),
        userId: id,
        channel: 'web',
        tokenHash: hashToken(token),
        refreshTokenHash: null,
        previousRefreshHash: null,
        accessExpiresAt: null,
        refreshExpiresAt: null,
        createdAt: now,
      })
    );
  }
  return id;
}

export const cookie = (token: string): string => `${SESSION_COOKIE_NAME}=${token}`;

/** Покласти активний login-код на номер (перевірка «старий номер не входить»). */
export function seedLoginCode(ctx: ChangePhoneApp, phone: string, code: string): void {
  ctx.challenges.save(
    OtpChallenge.create({
      id: testId(),
      phone,
      codeHash: hashOtpCode(code),
      purpose: 'login',
      now: new Date(),
    })
  );
}
