// Біометричний вхід (T-4426): оркестрація «пристрій ↔ сесія» без React і без
// HTTP. Порт `BiometricPort` — це той самий набір викликів, що дає
// `biometricsService` (Keychain/Keystore) у проді; тут лише правила, коли
// біометрія доступна і що робити при відмові.

export interface BiometricPort {
  hasHardwareAsync(): Promise<boolean>;
  isEnrolledAsync(): Promise<boolean>;
  authenticateAsync(prompt?: string): Promise<{ success: boolean; error?: string }>;
  getBiometricEnabled(): Promise<boolean>;
  setBiometricEnabled(enabled: boolean, token?: string): Promise<void>;
  getSecureToken(): Promise<string | null>;
  invalidate(): Promise<void>;
}

export type BiometricAvailability =
  | { available: true }
  | { available: false; reason: 'no_hardware' | 'not_enrolled' | 'not_enabled' | 'no_key' };

/** Чи можна запропонувати біометричний вхід: залізо, відбиток, згода і ключ. */
export async function biometricAvailability(port: BiometricPort): Promise<BiometricAvailability> {
  if (!(await port.hasHardwareAsync())) return { available: false, reason: 'no_hardware' };
  if (!(await port.isEnrolledAsync())) return { available: false, reason: 'not_enrolled' };
  if (!(await port.getBiometricEnabled())) return { available: false, reason: 'not_enabled' };
  if (!(await port.getSecureToken())) return { available: false, reason: 'no_key' };
  return { available: true };
}

/** Після успішного OTP: зберігає refresh-токен у Keychain і вмикає біометрію. */
export async function enableBiometricLogin(
  port: BiometricPort,
  refreshToken: string
): Promise<void> {
  if (!refreshToken) throw new Error('Biometric key requires a refresh token');
  await port.setBiometricEnabled(true, refreshToken);
}

/** Вихід або скидання: прибирає і ключ, і згоду — підміна акаунта неможлива. */
export async function disableBiometricLogin(port: BiometricPort): Promise<void> {
  await port.invalidate();
}

export type BiometricSignInResult<T> =
  | { ok: true; session: T }
  | { ok: false; reason: 'unavailable' | 'cancelled' | 'no_key' | 'exchange_failed' };

/**
 * Вхід за біометрією: локальна перевірка → ключ із Keychain → обмін на сесію.
 * Порожній ключ після успішної перевірки — прибираємо згоду (ключ зник) і
 * кажемо клієнту повторити OTP; помилка обміну не чіпає згоду (повторний запит).
 */
export async function signInWithBiometrics<T>(
  port: BiometricPort,
  exchange: (refreshToken: string) => Promise<T>
): Promise<BiometricSignInResult<T>> {
  const availability = await biometricAvailability(port);
  if (!availability.available) {
    // Зниклий ключ означає, що згода більше не чинна — прибираємо її.
    if (availability.reason === 'no_key') {
      await port.invalidate();
      return { ok: false, reason: 'no_key' };
    }
    return { ok: false, reason: 'unavailable' };
  }

  const auth = await port.authenticateAsync('Увійдіть через Face ID / Touch ID');
  if (!auth.success) return { ok: false, reason: 'cancelled' };

  const token = await port.getSecureToken();
  if (!token) {
    await port.invalidate();
    return { ok: false, reason: 'no_key' };
  }

  try {
    return { ok: true, session: await exchange(token) };
  } catch {
    return { ok: false, reason: 'exchange_failed' };
  }
}
