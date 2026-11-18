// Константи політики OTP і форми даних челенджу — окремо від агрегата
// (otp-challenge.ts): значення юзають use cases/контролери напряму.

export const OTP_TTL_MIN = 5;
export const OTP_RESEND_SEC = 60;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_LOCK_MIN = 10;

/** Призначення OTP-коду: вхід (дефолт), верифікація номера для телефонного
 * запису (T-4409) або зміна номера клієнта (T-4620). Живе тут (leaf-модуль),
 * щоб шалендж не залежав від ports; ports його реекспортує. */
export type OtpPurpose = 'login' | 'booking' | 'phone_change';

export type OtpVerifyResult =
  'ok' | 'expired' | 'locked' | 'used' | 'invalid' | 'too_many_attempts';

export interface OtpChallengeData {
  id: string;
  phone: string;
  codeHash: string;
  /** T-4620: код одного призначення не завершує інший сценарій. */
  purpose: OtpPurpose;
  expiresAt: Date;
  resendAfter: Date;
  attempts: number;
  lockedUntil: Date | null;
  usedAt: Date | null;
  createdAt: Date;
}

export interface CreateOtpChallenge {
  id: string;
  phone: string;
  codeHash: string;
  now: Date;
  /** Дефолт 'login' — сумісність з викликачами входу. */
  purpose?: OtpPurpose;
}
