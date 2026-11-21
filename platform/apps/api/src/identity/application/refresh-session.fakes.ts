// Хелпери спек RefreshSessionHandler (T-014) — окремо від *.spec.ts (Jest
// не повинен підхоплювати хелпери як тести через імпорт між спеками).

import { RefreshSessionHandler } from './refresh-session';
import {
  FakeClock,
  FakeOutbox,
  FakeSessionRepository,
  FakeUserRepository,
  passthroughUow,
} from './ports.fakes';
import { Session } from '../domain/session';
import { PhoneNumber } from '../domain/phone-number';
import { User } from '../domain/user';
import { generateToken, hashToken } from '../domain/otp-code';
import { SESSION_1, USER_1 } from './test-ids';

export const T0 = '2026-09-28T10:00:00.000Z';
export const ACCESS_TTL = 15 * 60;
export const REFRESH_TTL = 30 * 24 * 60 * 60;

export function setup() {
  const clock = new FakeClock(T0);
  const sessions = new FakeSessionRepository();
  const users = new FakeUserRepository();
  const outbox = new FakeOutbox();
  const handler = new RefreshSessionHandler({
    sessions,
    users,
    outbox,
    clock,
    uow: passthroughUow,
  });
  return { handler, sessions, users, outbox, clock };
}

/** Mobile-сесія з відомим refresh (повертає сирий refresh-токен). */
export async function seedMobileSession(
  sessions: FakeSessionRepository,
  users: FakeUserRepository
) {
  users.save(
    User.create({
      id: USER_1,
      phone: PhoneNumber.of('+380501234567'),
      role: 'client',
      createdAt: new Date(T0),
    })
  );
  const refreshToken = generateToken();
  const session = Session.issue({
    id: SESSION_1,
    userId: USER_1,
    channel: 'mobile',
    tokenHash: hashToken('old-access'),
    refreshTokenHash: hashToken(refreshToken),
    previousRefreshHash: null,
    accessExpiresAt: new Date(Date.parse(T0) + ACCESS_TTL * 1000),
    refreshExpiresAt: new Date(Date.parse(T0) + REFRESH_TTL * 1000),
    createdAt: new Date(T0),
  });
  await sessions.save(session);
  return { session, refreshToken };
}
