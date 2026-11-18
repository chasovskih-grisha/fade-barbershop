// OtpChallenge — одноразовий код для номера (ADR 0005):
// TTL 5 хв, повтор ≤60 с, ліміт 5 спроб → блокування на 10 хв, використаний код — used.
// Константи політики й форми даних — у otp-challenge.data.ts.

import { otpMatches } from './otp-code';
import {
  OTP_LOCK_MIN,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_SEC,
  OTP_TTL_MIN,
  type CreateOtpChallenge,
  type OtpChallengeData,
  type OtpPurpose,
  type OtpVerifyResult,
} from './otp-challenge.data';

export { OTP_LOCK_MIN, OTP_MAX_ATTEMPTS, OTP_RESEND_SEC, OTP_TTL_MIN } from './otp-challenge.data';
export type {
  CreateOtpChallenge,
  OtpChallengeData,
  OtpPurpose,
  OtpVerifyResult,
} from './otp-challenge.data';

export class OtpChallenge {
  private constructor(private readonly data: OtpChallengeData) {}

  static create(input: CreateOtpChallenge): OtpChallenge {
    return new OtpChallenge({
      id: input.id,
      phone: input.phone,
      codeHash: input.codeHash,
      purpose: input.purpose ?? 'login',
      expiresAt: new Date(input.now.getTime() + OTP_TTL_MIN * 60_000),
      resendAfter: new Date(input.now.getTime() + OTP_RESEND_SEC * 1_000),
      attempts: 0,
      lockedUntil: null,
      usedAt: null,
      createdAt: input.now,
    });
  }

  static reconstitute(data: OtpChallengeData): OtpChallenge {
    return new OtpChallenge(data);
  }

  get id(): string {
    return this.data.id;
  }

  get phone(): string {
    return this.data.phone;
  }

  /** T-4620: призначення коду — код входу не завершує зміну номера. */
  get purpose(): OtpPurpose {
    return this.data.purpose;
  }

  get codeHash(): string {
    return this.data.codeHash;
  }

  get expiresAt(): Date {
    return this.data.expiresAt;
  }

  get resendAfter(): Date {
    return this.data.resendAfter;
  }

  get attempts(): number {
    return this.data.attempts;
  }

  get lockedUntil(): Date | null {
    return this.data.lockedUntil;
  }

  get usedAt(): Date | null {
    return this.data.usedAt;
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  // Чи можна надсилати новий код зараз (з урахуванням ліміту повтору).
  canResend(now: Date): boolean {
    return now.getTime() >= this.data.resendAfter.getTime();
  }

  // Верифікація коду: списывает ліміт спроб і блокує при перевищенні.
  // Повертає результат; стан агрегата змінюється і має бути збережений.
  verify(now: Date, code: string): OtpVerifyResult {
    if (this.data.usedAt) return 'used';
    if (now.getTime() > this.data.expiresAt.getTime()) return 'expired';
    if (this.data.lockedUntil && now.getTime() < this.data.lockedUntil.getTime()) return 'locked';
    if (otpMatches(this.data.codeHash, code)) {
      this.data.usedAt = now;
      return 'ok';
    }
    this.data.attempts += 1;
    if (this.data.attempts >= OTP_MAX_ATTEMPTS) {
      this.data.lockedUntil = new Date(now.getTime() + OTP_LOCK_MIN * 60_000);
      return 'too_many_attempts';
    }
    return 'invalid';
  }
}
