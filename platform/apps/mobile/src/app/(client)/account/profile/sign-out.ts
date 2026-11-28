import { biometricsService } from '@/lib/biometrics';
import { disableBiometricLogin } from '@/lib/biometric-login';
import { writeSession } from '@/lib/session-store';

export const SIGN_OUT = 'Вийти';
export const SIGN_OUT_TITLE = 'Вийти з цього пристрою?';
export const SIGN_OUT_CANCEL = 'Скасувати';

/**
 * Гасить лише локальну сесію (T-4723c): без revoke-all, без зміни перемикачів
 * сповіщень і без зняття push-токена — його знімає тільки перемикач push.
 */
export async function signOutThisDevice(): Promise<void> {
  await disableBiometricLogin(biometricsService);
  writeSession(null);
}
