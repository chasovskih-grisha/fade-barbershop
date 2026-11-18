// AdminClientOtp — OTP для телефонного запису (T-4409, admin-screens §6.2):
// адмін ініціює код на номер клієнта (purpose 'booking' → суфікс «для запису
// по телефону» у шаблоні) і верифікує прочитаний клієнтом код. ВЕРИФІКАЦІЯ НЕ
// СТВОРЮЄ клієнтську сесію (на відміну від VerifyOtp) — лише фіксує
// phoneVerifiedAt на User (ідемпотентно: перша дата лишається) і подію
// PhoneVerified в outbox. Код ніде не логується — гейт «коду немає ніде,
// крім SMS-каналу» фіксує тест AdminRequestClientOtp (noop-sender).
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
  UserRepository,
} from '../domain/ports';
import { InvalidPhoneError, OtpResendTooSoonError } from './identity-errors';
import type { AdminOnboardClientHandler } from './admin-onboard-client';

export interface AdminClientOtpDeps {
  users: UserRepository;
  challenges: OtpChallengeRepository;
  sender: OtpSender;
  outbox: Outbox;
  clock: Clock;
  ids: IdGenerator;
  uow: UnitOfWork;
  /** T-046: нема User → створюємо клієнта на місці (identity + crm-профіль).
   *  Опційний: без нього verify падає USER_NOT_FOUND, як у T-4409. */
  onboarding?: AdminOnboardClientHandler;
}

/** Ініціація: адмін просить код для клієнта на його номер. */
export class AdminRequestClientOtpHandler {
  constructor(private readonly deps: AdminClientOtpDeps) {}

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
        const waitSec = Math.ceil((last.resendAfter.getTime() - now.getTime()) / 1000);
        throw new OtpResendTooSoonError(Math.max(1, waitSec));
      }
      const digits = generateOtpCode();
      await challenges.save(
        OtpChallenge.create({
          id: ids.id(),
          phone: phone.value,
          codeHash: hashOtpCode(digits),
          now,
        })
      );
      // purpose 'booking' → шаблон із суфіксом «для запису по телефону»;
      // digits іде ТІЛЬКИ в канал (SMS/console/mailpit) — не в події/логи.
      await sender.send(phone.value, digits, 'booking');
      await outbox.append([new OtpRequested(phone.value, now, 'booking')]);
      return { retryAfterSec: 60 };
    });
  }
}

/** Верифікація: клієнт прочитав код адміну. Успіх → PhoneVerified на User;
 * без User — клієнт створюється на місці (T-046, через AdminOnboardClientHandler). */
export { AdminVerifyClientOtpHandler } from './admin-client-otp.verify';
export {
  AdminRegisterClientHandler,
  type AdminRegisterClientDeps,
  type AdminRegisterClientInput,
  type AdminRegisterClientOutput,
} from './admin-register-client';
export {
  AdminOnboardClientHandler,
  type AdminOnboardClientDeps,
  type AdminOnboardClientInput,
  type AdminOnboardClientOutput,
  type ClientProfilesPort,
} from './admin-onboard-client';
