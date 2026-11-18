// Помилки use cases identity. Код мапається на HTTP відповіді в controller.

export class IdentityError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'IdentityError';
  }
}

/** Проста помилка з фіксованим кодом і повідомленням, без власних полів:
 * `new X()` і `instanceof X` працюють як у явного класу. */
function fixedError(code: string, message: string): new () => IdentityError {
  return class extends IdentityError {
    constructor() {
      super(code, message);
    }
  };
}

// Повторний запит OTP раніше ніж через 60 с.
export class OtpResendTooSoonError extends IdentityError {
  constructor(public readonly retryAfterSec: number) {
    super('OTP_RESEND_TOO_SOON', `Retry otp in ${retryAfterSec}s`);
  }
}

export const OtpChallengeNotFoundError = fixedError(
  'OTP_CHALLENGE_NOT_FOUND',
  'No active otp challenge for phone'
);
export const OtpExpiredError = fixedError('OTP_EXPIRED', 'Otp code expired');
export const OtpInvalidError = fixedError('OTP_INVALID', 'Wrong otp code');

export class OtpLockedError extends IdentityError {
  constructor(public readonly retryAfterSec: number) {
    super('OTP_LOCKED', 'Too many attempts, retry later');
  }
}

// Невірний формат номера (не E.164 +380 Україна).
export const InvalidPhoneError = fixedError(
  'INVALID_PHONE',
  'Phone must be valid +380 Ukraine number'
);

// Верифікація OTP (T-4409): клієнта з таким номером ще не існує. З T-046
// admin-verify створює клієнта «на місці», тож у типовій збірці помилка не
// виникає; лишається для legacy-збірки без onboarding і інших use cases.
export const UserNotFoundError = fixedError('USER_NOT_FOUND', 'No user for this phone yet');

// Невірний формат коду або каналу (повідомлення — від викликача).
export class InvalidOtpInputError extends IdentityError {
  constructor(message: string) {
    super('INVALID_OTP_INPUT', message);
  }
}

// Адмін-вхід (T-013): користувача немає або пароль невірний — не світимо, що саме.
export const AdminInvalidCredentialsError = fixedError(
  'ADMIN_INVALID_CREDENTIALS',
  'Wrong username or password'
);

// Адмін-вхід (T-013): акаунт існує, але роль не `admin`.
export const AdminAccessForbiddenError = fixedError(
  'ADMIN_ACCESS_FORBIDDEN',
  'Admin access required'
);

// T-4411: цільова адмін-обліковка не знайдена (скидання/блокування).
export const AdminNotFoundError = fixedError('ADMIN_NOT_FOUND', 'Admin account not found');

// T-014: refresh-токен відсутній/прострочений/відкликаний — пара не оновлюється.
export const RefreshTokenInvalidError = fixedError(
  'REFRESH_TOKEN_INVALID',
  'Refresh token is invalid or expired'
);

// T-014: reuse вже використаного refresh — сигнал компрометації; сесія
// інвалідовується повністю (повний logout), подія identity.session.revoked.
export const RefreshTokenReuseError = fixedError(
  'REFRESH_TOKEN_REUSE',
  'Refresh token reuse detected; session revoked'
);

// T-4422: некоректна email-адреса для сповіщень безпеки.
export const InvalidClientEmailError = fixedError(
  'INVALID_CLIENT_EMAIL',
  'Email address is not valid'
);

// T-4422: email уже зайняв інший акаунт (спільна скринька = чужі сповіщення).
export const ClientEmailTakenError = fixedError('CLIENT_EMAIL_TAKEN', 'Email is already in use');

// T-070/T-4422: push-токен не схожий на Expo-токен пристрою.
export const InvalidPushTokenError = fixedError(
  'INVALID_PUSH_TOKEN',
  'Push token must be an Expo device token'
);

// T-4620a: код, яким намагаються завершити зміну номера, має інше призначення
// (напр. логін-код) — сценарій не збігається, код не приймаємо.
export const OtpPurposeMismatchError = fixedError(
  'OTP_PURPOSE_MISMATCH',
  'Otp code purpose does not match this flow'
);

// T-4620a: новий номер уже верифіковано на іншому користувачі — зміну
// відхиляємо (без авто-merge; T-4423 займається дублями окремо).
export const PhoneTakenError = fixedError(
  'PHONE_TAKEN',
  'This phone number already belongs to another account'
);
