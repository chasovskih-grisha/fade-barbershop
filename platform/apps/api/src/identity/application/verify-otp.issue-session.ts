// Випуск сесії після успішної OTP-верифікації (T-014: mobile = access+refresh).
// Винесено з verify-otp.ts (max-lines).

import { SessionStarted, UserRegistered, type DomainEvent } from '../domain/events';
import { User } from '../domain/user';
import { Session, type SessionChannel } from '../domain/session';
import { generateToken, hashToken } from '../domain/otp-code';
import type { PhoneNumber } from '../domain/phone-number';
import type {
  Clock,
  IdGenerator,
  Outbox,
  SessionRepository,
  UserRepository,
} from '../domain/ports';
import { accessTtlSec, refreshTtlSec } from './token-ttl';
import type { VerifyOutcome } from './verify-otp.types';

export async function issueVerifySession(args: {
  users: UserRepository;
  sessions: SessionRepository;
  outbox: Outbox;
  clock: Clock;
  ids: IdGenerator;
  phone: PhoneNumber;
  channel: SessionChannel;
}): Promise<Extract<VerifyOutcome, { status: 'success' }>> {
  const { users, sessions, outbox, clock, ids, phone, channel } = args;
  const now = clock.now();
  let user = await users.findByPhone(phone.value);
  const events: DomainEvent[] = [];
  if (!user) {
    user = User.create({ id: ids.id(), phone, role: 'client', createdAt: now });
    await users.save(user);
    events.push(new UserRegistered(user.id, phone.value, now));
  }

  // T-014: mobile = access + refresh bearer; інші канали — cookie-токен.
  const isMobile = channel === 'mobile';
  const token = generateToken();
  const refreshToken = isMobile ? generateToken() : null;
  const ttl = accessTtlSec();
  const session = Session.issue({
    id: ids.id(),
    userId: user.id,
    channel,
    tokenHash: hashToken(token),
    refreshTokenHash: refreshToken ? hashToken(refreshToken) : null,
    previousRefreshHash: null,
    accessExpiresAt: isMobile ? new Date(now.getTime() + ttl * 1000) : null,
    refreshExpiresAt: isMobile ? new Date(now.getTime() + refreshTtlSec() * 1000) : null,
    createdAt: now,
  });
  await sessions.save(session);
  events.push(new SessionStarted(session, now));
  await outbox.append(events);
  return {
    status: 'success',
    token,
    userId: user.id,
    phone: phone.value,
    channel,
    refreshToken,
    expiresInSec: isMobile ? ttl : null,
  };
}
