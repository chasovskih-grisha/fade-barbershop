// Мапер результатів verify → доменні помилки (спільний із verify-otp;
// окремий файл, щоб не тягнути сесійні помилки в admin-потік).
import type { OtpVerifyResult } from '../domain/otp-challenge';
import { OtpExpiredError, OtpInvalidError, OtpLockedError } from './identity-errors';

export function toVerifyError(result: OtpVerifyResult): never {
  if (result === 'used' || result === 'expired') throw new OtpExpiredError();
  if (result === 'locked' || result === 'too_many_attempts') throw new OtpLockedError(600);
  throw new OtpInvalidError();
}
