// VerifyOtp — номер + код → Session. Перший успішний OTP створює User (роль client) —
// неявна реєстрація, без окремого UI (ADR 0005). Події: UserRegistered, SessionStarted.
// Невдалі спроби комітяться в транзакції (їх має бачити блокування перебору), а помилка
// кидається вже після коміту — у контролері.
// T-014: канал mobile отримує пару access + refresh (ADR 0005 bearer); web/admin —
// один довгоживучий токен під cookie (ADR 0017), без refresh.

import { PhoneNumber } from '../domain/phone-number';
import type { OtpVerifyResult } from '../domain/otp-challenge';
import {
  InvalidOtpInputError,
  OtpChallengeNotFoundError,
  OtpExpiredError,
  OtpInvalidError,
  OtpLockedError,
  OtpPurposeMismatchError,
} from './identity-errors';
import { issueVerifySession } from './verify-otp.issue-session';
import type {
  VerifyOtpDeps,
  VerifyOtpInput,
  VerifyOtpResult,
  VerifyOutcome,
} from './verify-otp.types';

export type {
  VerifyOtpDeps,
  VerifyOtpInput,
  VerifyOtpResult,
  VerifyOutcome,
} from './verify-otp.types';

export class VerifyOtpHandler {
  constructor(private readonly deps: VerifyOtpDeps) {}

  handle(input: VerifyOtpInput): Promise<VerifyOtpResult> {
    const { users, challenges, sessions, outbox, clock, ids, uow } = this.deps;
    return uow
      .run(async (): Promise<VerifyOutcome> => {
        const phone = this.phoneOf(input.phone);
        const challenge = await challenges.findLastByPhone(phone.value);
        if (!challenge) throw new OtpChallengeNotFoundError();
        // T-4620a: код іншого призначення (booking/phone_change) не завершує
        // вхід — перевіряємо purpose, а не лише цифри.
        if (challenge.purpose !== 'login') throw new OtpPurposeMismatchError();

        const now = clock.now();
        const result = challenge.verify(now, input.code);
        await challenges.save(challenge);
        if (result !== 'ok') return { status: 'failure', result };

        return issueVerifySession({
          users,
          sessions,
          outbox,
          clock,
          ids,
          phone,
          channel: input.channel,
        });
      })
      .then((outcome) => {
        if (outcome.status === 'failure') this.throwFor(outcome.result);
        return outcome;
      });
  }

  private phoneOf(phone: string): PhoneNumber {
    try {
      return PhoneNumber.of(phone);
    } catch {
      throw new InvalidOtpInputError('Phone must be valid +380 Ukraine number');
    }
  }

  private throwFor(result: OtpVerifyResult): never {
    if (result === 'used' || result === 'expired') throw new OtpExpiredError();
    if (result === 'locked') throw new OtpLockedError(600);
    if (result === 'too_many_attempts') throw new OtpLockedError(600);
    throw new OtpInvalidError();
  }
}
