// ChangePhoneRequest (T-4620a): клієнт з активною сесією просить код на НОВИЙ
// номер. Purpose 'phone_change' — щоб SMS не виглядав як логін-код і щоб
// логін-код не завершив зміну (purpose перевіряє verify, не лише цифри).
// Той самий шалендж-механізм, що в RequestOtp (TTL 5 хв, повтор ≤60 с).

import { PhoneNumber } from '../domain/phone-number';
import { OtpChallenge } from '../domain/otp-challenge';
import { OtpRequested } from '../domain/events';
import { generateOtpCode, hashOtpCode } from '../domain/otp-code';
import { InvalidPhoneError, OtpResendTooSoonError } from './identity-errors';
import type { ChangePhoneDeps, ChangePhoneRequestResult } from './change-phone.types';

export class ChangePhoneRequestHandler {
  constructor(private readonly deps: ChangePhoneDeps) {}

  async handle(input: { phone: string }): Promise<ChangePhoneRequestResult> {
    const { challenges, sender, outbox, clock, ids, uow } = this.deps;
    return uow.run(async () => {
      let phone: PhoneNumber;
      try {
        phone = PhoneNumber.of(input.phone);
      } catch {
        throw new InvalidPhoneError();
      }

      const now = clock.now();
      const last = await challenges.findLastByPhone(phone.value);
      if (last && !last.canResend(now)) {
        const waitSec = Math.max(1, Math.ceil((last.resendAfter.getTime() - now.getTime()) / 1000));
        throw new OtpResendTooSoonError(waitSec);
      }

      const digits = generateOtpCode();
      await challenges.save(
        OtpChallenge.create({
          id: ids.id(),
          phone: phone.value,
          codeHash: hashOtpCode(digits),
          purpose: 'phone_change',
          now,
        })
      );
      await sender.send(phone.value, digits, 'phone_change');
      await outbox.append([new OtpRequested(phone.value, now, 'phone_change')]);
      return { retryAfterSec: 60 };
    });
  }
}
