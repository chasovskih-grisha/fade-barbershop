// E2E harness: mobile refresh flow (T-014).
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request, { type Response } from 'supertest';
import { IdentityModule } from '../infrastructure/identity.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  PrismaOtpChallengeRepository,
  PrismaUserRepository,
} from '../infrastructure/prisma-adapters';
import { PrismaSessionRepository } from '../infrastructure/prisma-session-repository';
import { PrismaOutboxPublisher } from '../infrastructure/prisma-outbox-publisher';
import { PrismaLoginAudit } from '../infrastructure/prisma-login-audit';
import { OtpSenderFactory } from '../infrastructure/otp-sender.factory';
import { hashOtpCode } from '../domain/otp-code';
import { OtpChallenge } from '../domain/otp-challenge';
import { MemChallenges, MemSessions, MemUsers } from './admin-client-otp.fakes';
import { uuidv7 } from '@fade/domain-shared';

// Реальний «зараз»: SystemClock у контролері порівнює expiry challenge-а з
// реальним часом (фейковий T0 давав би OTP_EXPIRED на іншій годині доби).
export const REFRESH_E2E_T0 = new Date();
export const REFRESH_E2E_PHONE = '+380501234567';

export type RefreshE2eCtx = {
  app: INestApplication;
  users: MemUsers;
  sessions: MemSessions;
  challenges: MemChallenges;
  challengeSeq: { n: number };
};

export async function createRefreshSessionApp(): Promise<RefreshE2eCtx> {
  const users = new MemUsers();
  const sessions = new MemSessions();
  const challenges = new MemChallenges();
  const moduleRef: TestingModule = await Test.createTestingModule({ imports: [IdentityModule] })
    .overrideProvider(PrismaService)
    .useValue({
      $connect: () => undefined,
      $disconnect: () => undefined,
      $transaction: async <T>(work: () => Promise<T>): Promise<T> => work(),
    })
    .overrideProvider(PrismaUserRepository)
    .useValue(users)
    .overrideProvider(PrismaOtpChallengeRepository)
    .useValue(challenges)
    .overrideProvider(PrismaSessionRepository)
    .useValue(sessions)
    .overrideProvider(PrismaLoginAudit)
    .useValue({ record: async () => undefined, list: async () => [] })
    .overrideProvider(PrismaOutboxPublisher)
    .useValue({ append: async () => undefined })
    .overrideProvider(OtpSenderFactory)
    .useValue({ build: () => ({ send: async () => undefined }) })
    .compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return { app, users, sessions, challenges, challengeSeq: { n: 0 } };
}

export async function loginMobile(ctx: RefreshE2eCtx, code: string): Promise<Response> {
  ctx.challengeSeq.n += 1;
  // Кожен наступний challenge — пізніший createdAt (findLastByPhone бере
  // останній; при рівних timestamps порядок невизначений).
  const now = new Date(REFRESH_E2E_T0.getTime() + ctx.challengeSeq.n * 60_000);
  await ctx.challenges.save(
    OtpChallenge.create({
      id: uuidv7(),
      phone: REFRESH_E2E_PHONE,
      codeHash: hashOtpCode(code),
      now,
    })
  );
  return request(ctx.app.getHttpServer())
    .post('/identity/otp/verify')
    .send({ phone: REFRESH_E2E_PHONE, code, channel: 'mobile' })
    .expect(200);
}
