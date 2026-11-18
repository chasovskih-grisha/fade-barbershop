// ChangePhone (T-4620a) — бандл use cases однією фабрикою (патерн
// CLIENT_SESSION_USE_CASES: гейт max-params у контролері; спільний deps).

import type { Provider } from '@nestjs/common';
import { ChangePhoneRequestHandler } from '../application/change-phone.request';
import { ChangePhoneVerifyHandler } from '../application/change-phone.verify';
import { SystemClock } from './system-clock';
import { UuidIdGenerator } from './uuid-id-generator';
import { OtpSenderFactory } from './otp-sender.factory';
import { PrismaOtpChallengeRepository, PrismaUserRepository } from './prisma-adapters';
import { PrismaOutboxPublisher } from './prisma-outbox-publisher';
import { PrismaSessionRepository } from './prisma-session-repository';
import { PrismaUnitOfWork } from '../../shared/prisma/prisma-context';
import { OTP_REQUEST_LIMITER, OTP_VERIFY_LIMITER } from '../../shared/rate-limit/rate-limit.module';
import { RateLimitMetrics } from '../../shared/rate-limit/rate-limit.metrics';
import type { RateLimiter } from '../../shared/rate-limit/rate-limiter';

const deps = [
  PrismaUserRepository,
  PrismaOtpChallengeRepository,
  PrismaSessionRepository,
  OtpSenderFactory,
  PrismaOutboxPublisher,
  SystemClock,
  UuidIdGenerator,
  PrismaUnitOfWork,
];

export const identityChangePhoneProviders: Provider[] = [
  {
    provide: 'CHANGE_PHONE_USE_CASES',
    useFactory: (...args: unknown[]) => {
      const [users, challenges, sessions, senderFactory, outbox, clock, ids, uow] = args as [
        PrismaUserRepository,
        PrismaOtpChallengeRepository,
        PrismaSessionRepository,
        OtpSenderFactory,
        PrismaOutboxPublisher,
        SystemClock,
        UuidIdGenerator,
        PrismaUnitOfWork,
      ];
      const sender = senderFactory.build();
      const shared = { users, challenges, sessions, sender, outbox, clock, ids, uow };
      return {
        request: new ChangePhoneRequestHandler(shared),
        verify: new ChangePhoneVerifyHandler(shared),
      };
    },
    inject: deps,
  },
  {
    provide: 'CHANGE_PHONE_RATE_LIMITS',
    useFactory: (...args: unknown[]) => {
      const [request, verify, violations] = args as [RateLimiter, RateLimiter, RateLimitMetrics];
      return { request, verify, violations };
    },
    inject: [OTP_REQUEST_LIMITER, OTP_VERIFY_LIMITER, RateLimitMetrics],
  },
];
