// Session revoke / refresh провайдери (T-014) + пристрої клієнта (T-4422).

import type { Provider } from '@nestjs/common';
import { RefreshSessionHandler } from '../application/refresh-session';
import { RevokeSessionHandler } from '../application/revoke-session';
import { ListClientSessionsHandler } from '../application/list-client-sessions';
import { RevokeAllSessionsHandler } from '../application/revoke-all-sessions';
import { SetClientEmailHandler } from '../application/set-client-email';
import { RegisterPushTokenHandler } from '../application/register-push-token';
import { RevokePushTokenHandler } from '../application/revoke-push-token';
import { SystemClock } from './system-clock';
import { PrismaUserRepository } from './prisma-adapters';
import { PrismaOutboxPublisher } from './prisma-outbox-publisher';
import { PrismaPushTokenRepository } from './prisma-push-token-repository';
import { PrismaSessionRepository } from './prisma-session-repository';
import { UuidIdGenerator } from './uuid-id-generator';
import { PrismaUnitOfWork } from '../../shared/prisma/prisma-context';
import { useCase } from './identity-provider.factory';

const U = PrismaUserRepository;
const S = PrismaSessionRepository;
const O = PrismaOutboxPublisher;
const P = PrismaPushTokenRepository;
const IDS = UuidIdGenerator;
const CLK = SystemClock;
const UOW = PrismaUnitOfWork;

export const identitySessionProviders: Provider[] = [
  useCase(RevokeSessionHandler, [S, O, CLK, UOW], (d) => ({
    sessions: d[0],
    outbox: d[1],
    clock: d[2],
    uow: d[3],
  })),
  useCase(RefreshSessionHandler, [S, U, O, CLK, UOW], (d) => ({
    sessions: d[0],
    users: d[1],
    outbox: d[2],
    clock: d[3],
    uow: d[4],
  })),
  // T-4422: бандл use cases пристроїв — ЄДИНА реєстрація (дублікати токенів
  // перезаписували б один одного); конструюємо хендлери прямо у фабриці.
  {
    provide: 'CLIENT_SESSION_USE_CASES',
    useFactory: (...deps: unknown[]) => {
      const [sessions, users, outbox, pushTokens, ids, clock, uow] = deps as [
        PrismaSessionRepository,
        PrismaUserRepository,
        PrismaOutboxPublisher,
        PrismaPushTokenRepository,
        UuidIdGenerator,
        SystemClock,
        PrismaUnitOfWork,
      ];
      return {
        list: new ListClientSessionsHandler(sessions),
        revokeAll: new RevokeAllSessionsHandler({ sessions, outbox, clock, uow }),
        setEmail: new SetClientEmailHandler({ users, outbox, clock, uow }),
        registerPush: new RegisterPushTokenHandler({ tokens: pushTokens, ids, clock, uow }),
        revokePush: new RevokePushTokenHandler({ tokens: pushTokens, clock, uow }),
      };
    },
    inject: [S, U, O, P, IDS, CLK, UOW],
  },
];
