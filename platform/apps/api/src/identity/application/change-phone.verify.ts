// ChangePhoneVerify (T-4620a): клієнт прочитав код з нового номера. В ОДНІЙ
// транзакції: перевірка призначення коду, споживання коду, перенос PhoneNumber
// на той самий User, ревок ІНШИХ сесій (поточна лишається — T-4620b гасить її
// на клієнті). Зайнятий іншим акаунтом номер → PhoneTakenError без запису
// (без авто-merge; дублі — T-4423). Невдалі спроби комітяться (як у VerifyOtp:
// інакше ліміт перебору не працює), помилка кидається вже після транзакції.

import { PhoneNumber } from '../domain/phone-number';
import { PhoneChanged } from '../domain/events';
import type { OtpVerifyResult } from '../domain/otp-challenge';
import {
  InvalidPhoneError,
  OtpChallengeNotFoundError,
  OtpPurposeMismatchError,
  PhoneTakenError,
  UserNotFoundError,
} from './identity-errors';
import { toVerifyError } from './admin-client-otp.errors';
import type {
  ChangePhoneDeps,
  ChangePhoneVerifyInput,
  ChangePhoneVerifyResult,
} from './change-phone.types';

type SwapOutcome =
  { status: 'success'; phone: string } | { status: 'failure'; result: OtpVerifyResult };

export class ChangePhoneVerifyHandler {
  constructor(private readonly deps: ChangePhoneDeps) {}

  handle(input: ChangePhoneVerifyInput): Promise<ChangePhoneVerifyResult> {
    return this.deps.uow
      .run(() => this.swap(input))
      .then((outcome) => {
        if (outcome.status === 'failure') throw toVerifyError(outcome.result);
        return { ok: true, phone: outcome.phone };
      });
  }

  private async swap(input: ChangePhoneVerifyInput): Promise<SwapOutcome> {
    const { users, challenges, clock } = this.deps;
    const phone = this.parse(input.phone);
    const challenge = await challenges.findLastByPhone(phone.value);
    if (!challenge) throw new OtpChallengeNotFoundError();
    if (challenge.purpose !== 'phone_change') throw new OtpPurposeMismatchError();

    const now = clock.now();
    const result = challenge.verify(now, input.code);
    await challenges.save(challenge);
    if (result !== 'ok') return { status: 'failure', result };

    const user = await users.findById(input.userId);
    if (!user) throw new UserNotFoundError();
    const owner = await users.findByPhone(phone.value);
    if (owner && owner.id !== user.id) throw new PhoneTakenError();

    const oldPhone = user.phone.value;
    user.changePhone(phone, now);
    await users.save(user);
    await this.revokeOthers(user.id, input.currentSessionId, now);
    await this.deps.outbox.append([
      new PhoneChanged({ userId: user.id, oldPhone, newPhone: phone.value, occurredAt: now }),
    ]);
    return { status: 'success', phone: phone.value };
  }

  private parse(raw: string): PhoneNumber {
    try {
      return PhoneNumber.of(raw);
    } catch {
      throw new InvalidPhoneError();
    }
  }

  private async revokeOthers(userId: string, currentSessionId: string, now: Date): Promise<void> {
    const active = await this.deps.sessions.findActiveByUser(userId);
    for (const session of active) {
      if (session.id === currentSessionId) continue;
      if (session.revoke(now)) await this.deps.sessions.save(session);
    }
  }
}
