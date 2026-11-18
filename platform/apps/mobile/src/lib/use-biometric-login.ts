import { useCallback, useEffect, useRef, useState } from 'react';
import { biometricsService } from './biometrics';
import {
  biometricAvailability,
  disableBiometricLogin,
  enableBiometricLogin,
  signInWithBiometrics,
  type BiometricSignInResult,
} from './biometric-login';
import { refreshSession } from './api/identity';

export interface MobileSession {
  accessToken: string;
  refreshToken?: string;
  name?: string;
}

const DEFAULT_FAILURE = 'Біометричний вхід недоступний на цьому пристрої.';

const FAILURE_TEXT: Record<string, string> = {
  unavailable: DEFAULT_FAILURE,
  cancelled: 'Біометричну перевірку не пройдено. Спробуйте ще раз.',
  no_key: 'Біометричний ключ зник. Увійдіть через OTP.',
  exchange_failed: 'Сесія застаріла. Увійдіть через OTP.',
};

/** Стан біометричного входу для екрана входу (T-4426). */
export function useBiometricLogin(onSession: (session: MobileSession) => void) {
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refreshAvailability = useCallback(async () => {
    const result = await biometricAvailability(biometricsService);
    if (mounted.current) setAvailable(result.available);
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refreshAvailability();
    return () => {
      mounted.current = false;
    };
  }, [refreshAvailability]);

  /** Після успішного OTP: зберігає refresh-токен і вмикає біометрію. */
  const remember = useCallback(
    async (refreshToken?: string) => {
      if (!refreshToken) return;
      await enableBiometricLogin(biometricsService, refreshToken);
      await refreshAvailability();
    },
    [refreshAvailability]
  );

  const signIn = useCallback(async () => {
    setError(null);
    const result: BiometricSignInResult<{ accessToken: string; refreshToken: string }> =
      await signInWithBiometrics(biometricsService, refreshSession);
    if (result.ok) {
      onSession(result.session);
      return;
    }
    setError(FAILURE_TEXT[result.reason] ?? DEFAULT_FAILURE);
    await refreshAvailability();
  }, [onSession, refreshAvailability]);

  /** Вихід/скидання: біометричний ключ більше не діє. */
  const forget = useCallback(async () => {
    await disableBiometricLogin(biometricsService);
    await refreshAvailability();
  }, [refreshAvailability]);

  return { available, error, remember, signIn, forget };
}
