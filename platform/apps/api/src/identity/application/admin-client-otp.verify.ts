// Верифікація admin-OTP (T-4409/T-046): клієнт прочитав код адміну. Успіх →
// phoneVerifiedAt на User + подія PhoneVerified в outbox. Сесію НЕ створює
// (на відміну від VerifyOtp) — ініціація коду в admin-client-otp.ts.
//
// T-046: клієнта, якого ще не існує, більше не відкидаємо (USER_NOT_FOUND
// «потрібен перший вхід» блокував перший візит нового клієнта). Розмова з
// клієнтом і код з SMS — доказ, що номер належить клієнту, тож User створюється
// «на місці» (роль client, phoneVerifiedAt = зараз) через AdminRegisterClientHandler.
import { PhoneNumber } from '../domain/phone-number';
import { PhoneVerified } from '../domain/events';

import { InvalidPhoneError, OtpChallengeNotFoundError, UserNotFoundError } from './identity-errors';
import { toVerifyError } from './admin-client-otp.errors';
import type { AdminClientOtpDeps } from './admin-client-otp';
import type { AdminOnboardClientHandler } from './admin-onboard-client';

export class AdminVerifyClientOtpHandler {
  /** Onboarding у deps (фабрика юзкейсу передає один bundle): без нього
   *  поведінка стара — нема User → USER_NOT_FOUND (T-4409). */
  constructor(private readonly deps: AdminClientOtpDeps) {}

  /** Опційний onboarding (T-046): нема User → створюємо клієнта на місці. */
  private get onboarding(): AdminOnboardClientHandler | undefined {
    return this.deps.onboarding;
  }

  async handle(input: {
    phone: string;
    code: string;
    actorId: string;
  }): Promise<{ phoneVerifiedAt: string; clientId: string }> {
    const { users, challenges, outbox, clock, uow } = this.deps;
    return uow.run(async () => {
      let phone: PhoneNumber;
      try {
        phone = PhoneNumber.of(input.phone);
      } catch {
        throw new InvalidPhoneError();
      }
      const now = clock.now();
      const challenge = await challenges.findLastByPhone(phone.value);
      if (!challenge) throw new OtpChallengeNotFoundError();

      const result = challenge.verify(now, input.code);
      await challenges.save(challenge);
      if (result !== 'ok') throw toVerifyError(result);

      // T-046: нема User → створюємо клієнта на місці (номер щойно доведено
      // кодом): User у identity + картка гостя в crm (через port збірки).
      let user = await users.findByPhone(phone.value);
      if (!user && this.onboarding) {
        const onboarded = await this.onboarding.handle({
          phone: input.phone,
          actorId: input.actorId,
        });
        user = await users.findById(onboarded.clientId);
      }
      if (!user) throw new UserNotFoundError();

      // Ідемпотентно: повторна верифікація не зсуває дату, подія — лише першого разу.
      if (user.markPhoneVerified(now)) {
        await users.save(user);
        await outbox.append([
          new PhoneVerified({
            userId: user.id,
            phone: phone.value,
            actorId: input.actorId,
            occurredAt: now,
          }),
        ]);
      }
      // markPhoneVerified(true) лишає now; false — дата вже була: ?? тут dead-code.
      const verifiedAt = user.phoneVerifiedAt ?? now;
      // clientId = User.id, а не ClientProfile.id: саме так Booking.clientId
      // пише web-флоу (client-bookings.controller → session.userId) і саме за
      // ним читають «Мої візити» (list-client-appointments, own-appointment).
      // ClientProfile.id тут дав би запис, невидимий у кабінеті клієнта.
      return { phoneVerifiedAt: verifiedAt.toISOString(), clientId: user.id };
    });
  }
}
