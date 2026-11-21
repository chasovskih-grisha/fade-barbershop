// Збірка тестового середовища спеки admin-client-otp: спільні clock/ids/uow,
// фабрика клієнта і зібраний ланцюг request/verify. Класи-фейки (пам'ять) —
// в admin-client-otp.fakes.ts, їх юзають і e2e-харнеси.
import { User } from '../domain/user';
import { PhoneNumber } from '../domain/phone-number';
import type { Clock, IdGenerator, UnitOfWork } from '../domain/ports';
import {
  AdminRequestClientOtpHandler,
  AdminVerifyClientOtpHandler,
  type AdminClientOtpDeps,
} from './admin-client-otp';
import { AdminOnboardClientHandler } from './admin-onboard-client';
import { AdminRegisterClientHandler } from './admin-register-client';
import {
  CapturingSender,
  MemChallenges,
  MemClientProfiles,
  MemOutbox,
  MemUsers,
  NOW,
} from './admin-client-otp.fakes';
import { USER_1 } from './test-ids';

export const passthrough: UnitOfWork = { run: async <T>(work: () => Promise<T>) => work() };
export const clock: Clock = { now: () => NOW };

export const ids: IdGenerator = {
  id: (() => {
    let n = 0;
    return () => 'id-' + ++n;
  })(),
};

export function clientUser(phone: string): User {
  return User.create({ id: USER_1, phone: PhoneNumber.of(phone), role: 'client', createdAt: NOW });
}

/** Перший надісланий OTP-код; кидає, якщо жодного коду не надіслано. */
export function sentCode(t: OtpHarness): string {
  const sent = t.sender.sent[0];
  if (!sent) throw new Error('OTP-код не надіслано');
  return sent.digits;
}

/** verify із першим надісланим кодом (у спеках надсилається рівно один). */
export const verifyWithSent = (t: OtpHarness, actorId: string) =>
  t.verify.handle({ phone: t.phone, code: sentCode(t), actorId });

/** Спільна частина харнеса: ланцюг request/verify + фейки-приймачі. */
export interface OtpHarness {
  users: MemUsers;
  sender: CapturingSender;
  outbox: MemOutbox;
  request: AdminRequestClientOtpHandler;
  verify: AdminVerifyClientOtpHandler;
  phone: string;
}

/**
 * Зібраний ланцюг request/verify для спеки (deps спільні).
 * verify за замовчуванням має onboarding (T-046: нема User → створюємо на
 * місці); buildLegacy — стара поведінка без onboarding (USER_NOT_FOUND).
 */
export function build(phone: string): OtpHarness & { clientProfiles: MemClientProfiles } {
  const users = new MemUsers();
  const sender = new CapturingSender();
  const outbox = new MemOutbox();
  const clientProfiles = new MemClientProfiles();
  const onboarding = new AdminOnboardClientHandler({
    uow: passthrough,
    registration: new AdminRegisterClientHandler({ users, outbox, clock, ids, uow: passthrough }),
    clientProfiles,
  });
  const deps: AdminClientOtpDeps = {
    users,
    challenges: new MemChallenges(),
    sender,
    outbox,
    clock,
    ids,
    uow: passthrough,
    onboarding,
  };
  return {
    users,
    sender,
    outbox,
    clientProfiles,
    request: new AdminRequestClientOtpHandler(deps),
    verify: new AdminVerifyClientOtpHandler(deps),
    phone,
  };
}

/** Стара поведінка (T-4409): verify без onboarding → нема User → USER_NOT_FOUND. */
export function buildLegacy(phone: string): OtpHarness {
  const users = new MemUsers();
  const sender = new CapturingSender();
  const outbox = new MemOutbox();
  const deps: AdminClientOtpDeps = {
    users,
    challenges: new MemChallenges(),
    sender,
    outbox,
    clock,
    ids,
    uow: passthrough,
  };
  return {
    users,
    sender,
    outbox,
    request: new AdminRequestClientOtpHandler(deps),
    verify: new AdminVerifyClientOtpHandler(deps),
    phone,
  };
}
