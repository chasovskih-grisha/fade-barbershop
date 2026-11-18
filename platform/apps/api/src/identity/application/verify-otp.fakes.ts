// Хелпери спек VerifyOtp (T-014) — окремо від спеків (max-lines) і спільні
// для успішного шляху (verify-otp.spec) та невдалих сценаріїв (errors.spec).
import { VerifyOtpHandler } from './verify-otp';
import {
  FakeClock,
  FakeOtpChallengeRepository,
  FakeOutbox,
  FakeSessionRepository,
  FakeUserRepository,
  UuidIds,
  passthroughUow,
} from './ports.fakes';
import { OtpChallenge } from '../domain/otp-challenge';
import { hashOtpCode } from '../domain/otp-code';
import { CHALLENGE_1 } from './test-ids';

export const T0 = '2026-09-21T10:00:00.000Z';
export const OTP_PHONE = '+380501234567';
export const CORRECT_CODE = '123456';
export const WRONG_CODE = '000000';

export interface VerifyOtpSetup {
  handler: VerifyOtpHandler;
  clock: FakeClock;
  challenges: FakeOtpChallengeRepository;
  users: FakeUserRepository;
  sessions: FakeSessionRepository;
  outbox: FakeOutbox;
}

/** Хендлер з одним активним шаленджем (код 123456) на OTP_PHONE. */
export const setupVerifyOtp = (withChallenge = true): VerifyOtpSetup => {
  const clock = new FakeClock(T0);
  const challenges = new FakeOtpChallengeRepository();
  if (withChallenge) {
    challenges.save(
      OtpChallenge.create({
        id: CHALLENGE_1,
        phone: OTP_PHONE,
        codeHash: hashOtpCode(CORRECT_CODE),
        now: new Date(T0),
      })
    );
  }
  const users = new FakeUserRepository();
  const sessions = new FakeSessionRepository();
  const outbox = new FakeOutbox();
  const handler = new VerifyOtpHandler({
    users,
    challenges,
    sessions,
    outbox,
    clock,
    ids: new UuidIds(),
    uow: passthroughUow,
  });
  return { handler, clock, challenges, users, sessions, outbox };
};

/** Верифікація з дефолтним тестовим номером (канал web). */
export const verifyCode = (handler: VerifyOtpHandler, code: string, phone = OTP_PHONE) =>
  handler.handle({ phone, code, channel: 'web' });

/** times невдалих спроб WRONG_CODE поспіль (для сценаріїв блокування). */
export const failWrongCode = async (handler: VerifyOtpHandler, times: number): Promise<void> => {
  for (let i = 0; i < times; i++) {
    await expect(verifyCode(handler, WRONG_CODE)).rejects.toThrow();
  }
};
