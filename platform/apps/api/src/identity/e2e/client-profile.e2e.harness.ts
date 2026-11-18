// E2E harness для клієнтського профілю (T-??): Nest app + Mem-провайдери,
// по схемі інших identity/e2e-спеків. Клієнтський профіль живе в CRM, але
// клієнтський вхід — через identity (ClientSessionGuard → cookie fadoidx).
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { IdentityModule } from '../infrastructure/identity.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PrismaClientProfileRepository } from '../../crm/infrastructure/prisma-client-profile.repository';
import { PrismaOutboxPublisher } from '../../crm/prisma-outbox-publisher';
import { PrismaUnitOfWork } from '../../shared/prisma/prisma-context';
import { PrismaSessionRepository } from '../infrastructure/prisma-session-repository';
import { PrismaUserRepository } from '../infrastructure/prisma-adapters';
import { SystemClock } from '../../crm/system-clock';
import { UuidIdGenerator } from '../../crm/uuid-id-generator';
import { ClientProfile } from '../../crm/domain/client-profile';
import { MemProfiles } from './client-profile.e2e.mem';
import type { ClientId } from '../../crm/domain/client-profile.types';
import { hashToken } from '../domain/otp-code';
import { PhoneNumber } from '../domain/phone-number';
import { User } from '../domain/user';
import { Session } from '../domain/session';
import { SESSION_COOKIE_NAME } from '../infrastructure/session-cookie';
import { PROFILE_1, SESSION_CLIENT, USER_CLIENT } from '../application/test-ids';
import { uuidv7 } from '@fade/domain-shared';

export const PROFILE_NOW = new Date('2026-09-29T10:00:00.000Z');
export const CLIENT_COOKIE = `${SESSION_COOKIE_NAME}=client-token-1`;

export { MemProfiles } from './client-profile.e2e.mem';

export async function createClientProfileApp(): Promise<{
  app: INestApplication;
  profiles: MemProfiles;
}> {
  const profiles = new MemProfiles();
  const moduleRef: TestingModule = await Test.createTestingModule({ imports: [IdentityModule] })
    .overrideProvider(PrismaService)
    .useValue({
      $connect: () => undefined,
      $disconnect: () => undefined,
      $transaction: async <T>(work: () => Promise<T>) => work(),
    })
    .overrideProvider(PrismaClientProfileRepository)
    .useValue(profiles)
    .overrideProvider(PrismaOutboxPublisher)
    .useValue({ append: async () => undefined })
    .overrideProvider(PrismaUnitOfWork)
    .useValue({ run: async (work: () => Promise<unknown>) => work() })
    .overrideProvider(SystemClock)
    .useValue({ now: () => PROFILE_NOW })
    .overrideProvider(UuidIdGenerator)
    .useValue({ id: () => uuidv7() })
    .overrideProvider(PrismaSessionRepository)
    .useValue({
      findByTokenHash: async (tokenHash: string) =>
        tokenHash === hashToken('client-token-1')
          ? // Гвард читає session.active — це геттер доменного Session,
            // тому повертаємо агрегат, а не plain-об'єкт (інакше 401).
            Session.reconstitute({
              id: SESSION_CLIENT,
              userId: USER_CLIENT,
              channel: 'web',
              tokenHash: hashToken('client-token-1'),
              refreshTokenHash: null,
              previousRefreshHash: null,
              accessExpiresAt: null,
              refreshExpiresAt: null,
              createdAt: PROFILE_NOW,
              revokedAt: null,
            })
          : null,
    })
    .overrideProvider(PrismaUserRepository)
    .useValue({
      findById: async (id: string) =>
        id === USER_CLIENT
          ? User.create({
              id: USER_CLIENT,
              phone: PhoneNumber.of('+380671111111'),
              role: 'client',
              name: 'Олег',
              createdAt: PROFILE_NOW,
            })
          : null,
    })
    .compile();
  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  await app.init();

  profiles.store.set(
    PROFILE_1 as ClientId,
    ClientProfile.reconstitute({
      id: PROFILE_1 as ClientId,
      userId: USER_CLIENT,
      name: 'Олег',
      phone: '+380671111111',
      preferences: [],
      notes: [],
      vipDiscountPercent: null,
      loyaltyVisitsCount: 2,
      createdAt: PROFILE_NOW,
      updatedAt: PROFILE_NOW,
    })
  );

  return { app, profiles };
}
