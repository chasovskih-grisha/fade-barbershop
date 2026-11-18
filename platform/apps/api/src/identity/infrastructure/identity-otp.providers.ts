// OTP use-case провайдери (клієнтський + адмінський T-4409; onboarding T-046).

import type { Provider } from '@nestjs/common';
import { RequestOtpHandler } from '../application/request-otp';
import { VerifyOtpHandler } from '../application/verify-otp';
import { AdminRequestClientOtpHandler, AdminVerifyClientOtpHandler } from '../application/admin-client-otp';
import { AdminOnboardClientHandler, type ClientProfilesPort } from '../application/admin-onboard-client';
import { AdminRegisterClientHandler } from '../application/admin-register-client';
import { SystemClock } from './system-clock';
import { UuidIdGenerator } from './uuid-id-generator';
import { OtpSenderFactory } from './otp-sender.factory';
import { PrismaOtpChallengeRepository, PrismaUserRepository } from './prisma-adapters';
import { PrismaOutboxPublisher } from './prisma-outbox-publisher';
import { PrismaSessionRepository } from './prisma-session-repository';
import { PrismaUnitOfWork } from '../../shared/prisma/prisma-context';
import { CrmClientProfilesAdapter } from './crm-client-profiles.adapter';
import { useCase, type Deps } from './identity-provider.factory';

const U = PrismaUserRepository;
const C = PrismaOtpChallengeRepository;
const S = PrismaSessionRepository;
const O = PrismaOutboxPublisher;
const CLK = SystemClock;
const IDS = UuidIdGenerator;
const UOW = PrismaUnitOfWork;
const SND = OtpSenderFactory;

const otpCore = [C, SND, O, CLK, IDS, UOW] as Deps;
const otpWithUsers = [U, C, SND, O, CLK, IDS, UOW] as Deps;
// Deps для AdminRegisterClientHandler (users/outbox/clock/ids/uow — без sender).
const registerDeps = [U, O, CLK, IDS, UOW] as Deps;

export const identityOtpProviders: Provider[] = [
  useCase(RequestOtpHandler, otpCore, (d) => ({
    challenges: d[0],
    sender: (d[1] as unknown as OtpSenderFactory).build(),
    outbox: d[2],
    clock: d[3],
    ids: d[4],
    uow: d[5],
  })),
  useCase(VerifyOtpHandler, [U, C, S, O, CLK, IDS, UOW], (d) => ({
    users: d[0],
    challenges: d[1],
    sessions: d[2],
    outbox: d[3],
    clock: d[4],
    ids: d[5],
    uow: d[6],
  })),
  useCase(AdminRequestClientOtpHandler, otpWithUsers, (d) => ({
    users: d[0],
    challenges: d[1],
    sender: (d[2] as unknown as OtpSenderFactory).build(),
    outbox: d[3],
    clock: d[4],
    ids: d[5],
    uow: d[6],
  })),
  useCase(AdminRegisterClientHandler, registerDeps, (d) => ({
    users: d[0],
    outbox: d[1],
    clock: d[2],
    ids: d[3],
    uow: d[4],
  })),
  useCase(
    AdminOnboardClientHandler,
    [UOW, AdminRegisterClientHandler, CrmClientProfilesAdapter],
    (d) => ({
      uow: d[0],
      registration: d[1] as unknown as AdminRegisterClientHandler,
      clientProfiles: d[2] as unknown as ClientProfilesPort,
    })
  ) as Provider,
  useCase(AdminVerifyClientOtpHandler, [...otpWithUsers, AdminOnboardClientHandler], (d) => ({
    users: d[0],
    challenges: d[1],
    sender: (d[2] as unknown as OtpSenderFactory).build(),
    outbox: d[3],
    clock: d[4],
    ids: d[5],
    uow: d[6],
    onboarding: d[7] as unknown as AdminOnboardClientHandler,
  })) as Provider,
];
