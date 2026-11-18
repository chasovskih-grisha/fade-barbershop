// Переклад доменних помилок identity на HTTP-статуси (T-011: окремий файл — max-lines).
// Помилка класифікується за своїм `.code` (див. identity-errors.ts); невідома → 500.
// Retry-After header ставить IdentityExceptionFilter (Nest 10 не має headers в HttpException).

import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { IdentityError } from '../application/identity-errors';
import { OtpLockedError, OtpResendTooSoonError } from '../application/identity-errors';

const STATUS_BY_CODE: Record<string, HttpStatus> = {
  INVALID_PHONE: HttpStatus.BAD_REQUEST,
  INVALID_OTP_INPUT: HttpStatus.BAD_REQUEST,
  OTP_CHALLENGE_NOT_FOUND: HttpStatus.BAD_REQUEST,
  OTP_EXPIRED: HttpStatus.BAD_REQUEST,
  OTP_INVALID: HttpStatus.BAD_REQUEST,
  OTP_RESEND_TOO_SOON: HttpStatus.TOO_MANY_REQUESTS,
  OTP_LOCKED: HttpStatus.TOO_MANY_REQUESTS,
  ADMIN_INVALID_CREDENTIALS: HttpStatus.UNAUTHORIZED,
  ADMIN_ACCESS_FORBIDDEN: HttpStatus.FORBIDDEN,
  BARBER_NOT_FOUND: HttpStatus.NOT_FOUND,
  BARBER_PHONE_TAKEN: HttpStatus.CONFLICT,
  INVALID_BARBER_INPUT: HttpStatus.BAD_REQUEST,
  USER_NOT_FOUND: HttpStatus.NOT_FOUND,
  ADMIN_NOT_FOUND: HttpStatus.NOT_FOUND,
  // T-014: refresh-токен невалідний або reuse (компрометація).
  REFRESH_TOKEN_INVALID: HttpStatus.UNAUTHORIZED,
  REFRESH_TOKEN_REUSE: HttpStatus.UNAUTHORIZED,
  // T-4422: email сповіщень безпеки.
  INVALID_CLIENT_EMAIL: HttpStatus.BAD_REQUEST,
  CLIENT_EMAIL_TAKEN: HttpStatus.CONFLICT,
  // T-070/T-4422: push-токен пристрою не схожий на Expo-токен.
  INVALID_PUSH_TOKEN: HttpStatus.BAD_REQUEST,
  // T-4620a: код іншого призначення (напр. логін) не завершує зміну номера.
  OTP_PURPOSE_MISMATCH: HttpStatus.BAD_REQUEST,
  // T-4620a: новий номер уже верифіковано на іншому акаунті.
  PHONE_TAKEN: HttpStatus.CONFLICT,
  // T-4409/T-4411 далі за потреби
};

export function toHttp(error: unknown): HttpException {
  if (!(error instanceof IdentityError)) return unknownError(error);
  const status = STATUS_BY_CODE[error.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
  return new HttpException(bodyOf(error), status);
}

export function bodyOf(error: IdentityError): {
  code: string;
  message: string;
  retryAfterSec?: number;
} {
  const withRetry = error instanceof OtpResendTooSoonError || error instanceof OtpLockedError;
  return withRetry
    ? { code: error.code, message: error.message, retryAfterSec: error.retryAfterSec }
    : { code: error.code, message: error.message };
}

function unknownError(error: unknown): HttpException {
  if (error instanceof Error) {
    if (error instanceof HttpException) return error;
    new Logger('IdentityController').error(error.message, error.stack);
    return new HttpException(
      { code: 'INTERNAL', message: 'Internal server error' },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
  throw error;
}
