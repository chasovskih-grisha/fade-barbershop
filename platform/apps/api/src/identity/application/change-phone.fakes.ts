// Хелпери спек ChangePhone (T-4620a) — окремо від спеків (max-lines).
// Спільні з портами фейки; сесії — з ports.session.fakes.

import { PhoneNumber } from '../domain/phone-number';
import { User } from '../domain/user';
import { Session } from '../domain/session';
import { OtpChallenge } from '../domain/otp-challenge';
import { generateOtpCode, generateToken, hashOtpCode, hashToken } from '../domain/otp-code';
import { ChangePhoneRequestHandler } from './change-phone.request';
import { ChangePhoneVerifyHandler } from './change-phone.verify';
import {
  FakeClock,
  FakeOtpChallengeRepository,
  FakeOtpSender,
  FakeOutbox,
  FakeSessionRepository,
  FakeUserRepository,
  UuidIds,
  passthroughUow,
} from './ports.fakes';
import { USER_1, USER_2, SESSION_1, SESSION_2, CHALLENGE_1 } from './test-ids';

export const T0 = '2026-10-01T10:00:00.000Z';
export const OLD_PHONE = '+380501234567';
export const NEW_PHONE = '+380509876543';
export const CODE = '123456';

export interface ChangePhoneSetup {
  request: ChangePhoneRequestHandler;
  verify: ChangePhoneVerifyHandler;
  clock: FakeClock;
  users: FakeUserRepository;
  sessions: FakeSessionRepository;
  challenges: FakeOtpChallengeRepository;
  sender: FakeOtpSender;
  outbox: FakeOutbox;
}

/** Клієнт USER_1 з номером OLD_PHONE і двома сесіями (поточна SESSION_1). */
export function setupChangePhone(): ChangePhoneSetup {
  const clock = new FakeClock(T0);
  const users = new FakeUserRepository();
  const sessions = new FakeSessionRepository();
  const challenges = new FakeOtpChallengeRepository();
  const sender = new FakeOtpSender();
  const outbox = new FakeOutbox();
  const ids = new UuidIds();

  users.save(
    User.create({
      id: USER_1,
      phone: PhoneNumber.of(OLD_PHONE),
      role: 'client',
      createdAt: new Date(T0),
    })
  );
  for (const id of [SESSION_1, SESSION_2]) {
    sessions.save(
      Session.issue({
        id,
        userId: USER_1,
        channel: 'web',
        tokenHash: hashToken(generateToken()),
        refreshTokenHash: null,
        previousRefreshHash: null,
        accessExpiresAt: null,
        refreshExpiresAt: null,
        createdAt: new Date(T0),
      })
    );
  }

  const deps = {
    users,
    challenges,
    sessions,
    sender,
    outbox,
    clock,
    ids,
    uow: passthroughUow,
  };
  return {
    request: new ChangePhoneRequestHandler(deps),
    verify: new ChangePhoneVerifyHandler(deps),
    clock,
    users,
    sessions,
    challenges,
    sender,
    outbox,
  };
}

/** Покласти активний phone_change-код на NEW_PHONE з відомими цифрами. */
export function seedPhoneChangeCode(
  challenges: FakeOtpChallengeRepository,
  digits = CODE,
  purpose: 'phone_change' | 'login' = 'phone_change'
): void {
  challenges.save(
    OtpChallenge.create({
      id: CHALLENGE_1,
      phone: NEW_PHONE,
      codeHash: hashOtpCode(digits),
      purpose,
      now: new Date(T0),
    })
  );
}

export { generateOtpCode, USER_1, USER_2, SESSION_1, SESSION_2 };
