// RequestOtp — номер → SMS (у dev — console OtpSender). ADR 0005:
// ліміт повторної відправки 60 с, TTL коду 5 хв (контролює шалендж).
// Подія OtpRequested фіксується в outbox (транзакційно разом зі збереженням).

import { PhoneNumber } from '../domain/phone-number';
import { OtpChallenge } from '../domain/otp-challenge';
import { OtpRequested } from '../domain/events';
import { generateOtpCode, hashOtpCode } from '../domain/otp-code';
import type {
  Clock,
  IdGenerator,
  OtpChallengeRepository,
  OtpSender,
  Outbox,
  UnitOfWork,
} from '../domain/ports';
import { InvalidPhoneError, OtpResendTooSoonError } from './identity-errors';

export interface RequestOtpDeps {
  challenges: OtpChallengeRepository;
  sender: OtpSender;
  outbox: Outbox;
  clock: Clock;
  ids: IdGenerator;
  uow: UnitOfWork;
}

export class RequestOtpHandler {
  constructor(private readonly deps: RequestOtpDeps) {}

  async handle(input: { phone: string }): Promise<{ retryAfterSec: number }> {
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
      const challenge = OtpChallenge.create({
        id: ids.id(),
        phone: phone.value,
        codeHash: hashOtpCode(digits),
        now,
      });
      await challenges.save(challenge);
      await sender.send(phone.value, digits);
      await outbox.append([new OtpRequested(phone.value, now)]);
      return { retryAfterSec: 60 };
    });
  }
}
