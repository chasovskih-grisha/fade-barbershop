// Хелпери спек пристроїв і сесій клієнта (T-4422) — окремо від *.spec.ts
// (Jest не підхоплює хелпери як тести через імпорт між спеками).

import { FakeClock, FakeOutbox, FakeSessionRepository, FakeUserRepository, UuidIds, passthroughUow } from './ports.fakes';
import { Session } from '../domain/session';
import { PhoneNumber } from '../domain/phone-number';
import { User } from '../domain/user';
import { generateToken, hashToken } from '../domain/otp-code';
import { USER_1 } from './test-ids';

export const T0 = '2026-09-30T10:00:00.000Z';

export function seedUser(
  users: FakeUserRepository,
  input: { id?: string; email?: string | null } = {}
): User {
  const user = User.create({
    id: input.id ?? USER_1,
    phone: PhoneNumber.of('+380501234567'),
    role: 'client',
    ...(input.email === undefined ? {} : { email: input.email }),
    createdAt: new Date(T0),
  });
  users.save(user);
  return user;
}

/** Сесія будь-якого клієнтського каналу з відомим сирым access-токеном. */
export function seedSession(
  sessions: FakeSessionRepository,
  input: {
    id: string;
    userId?: string;
    channel: 'web' | 'mobile' | 'admin';
    revoked?: boolean;
    /** Перекриття життя access (гвард валідує проти реального часу). */
    accessExpiresAt?: Date;
  }
): { session: Session; token: string } {
  const token = generateToken();
  const isMobile = input.channel === 'mobile';
  const session = Session.issue({
    id: input.id,
    userId: input.userId ?? USER_1,
    channel: input.channel,
    tokenHash: hashToken(token),
    refreshTokenHash: isMobile ? hashToken(generateToken()) : null,
    previousRefreshHash: null,
    accessExpiresAt:
      input.accessExpiresAt ?? (isMobile ? new Date(Date.parse(T0) + 15 * 60 * 1000) : null),
    refreshExpiresAt: isMobile ? new Date(Date.parse(T0) + 30 * 24 * 3600 * 1000) : null,
    createdAt: new Date(T0),
  });
  if (input.revoked) session.revoke(new Date(T0));
  sessions.save(session);
  return { session, token };
}

export {
  FakeClock,
  FakeOutbox,
  FakeSessionRepository,
  FakeUserRepository,
  UuidIds,
  passthroughUow,
};
