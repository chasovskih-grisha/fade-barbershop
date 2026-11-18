import {
  biometricAvailability,
  enableBiometricLogin,
  disableBiometricLogin,
  signInWithBiometrics,
  type BiometricPort,
} from './biometric-login';

/** Фейковий пристрій у пам'яті — без jest-моків, як FakeOtpSender. */
function fakeDevice(overrides: Partial<BiometricPort> = {}): BiometricPort {
  const state = { hardware: true, enrolled: true, enabled: false, token: null as string | null };
  return {
    hasHardwareAsync: async () => state.hardware,
    isEnrolledAsync: async () => state.enrolled,
    authenticateAsync: async () => ({ success: true }),
    getBiometricEnabled: async () => state.enabled,
    setBiometricEnabled: async (enabled, token) => {
      state.enabled = enabled;
      state.token = enabled ? (token ?? null) : null;
    },
    getSecureToken: async () => state.token,
    invalidate: async () => {
      state.enabled = false;
      state.token = null;
    },
    ...overrides,
  };
}

describe('T-4426 biometric login', () => {
  it('ключ зберігається після OTP і прибирається при виході', async () => {
    const port = fakeDevice();
    await enableBiometricLogin(port, 'refresh-seed-1');
    expect(await port.getSecureToken()).toBe('refresh-seed-1');
    expect(await port.getBiometricEnabled()).toBe(true);

    await disableBiometricLogin(port);
    expect(await port.getSecureToken()).toBeNull();
    expect(await port.getBiometricEnabled()).toBe(false);
  });

  it('порожній refresh-токен не вмикає біометрію', async () => {
    const port = fakeDevice();
    await expect(enableBiometricLogin(port, '')).rejects.toThrow('refresh token');
  });

  it('доступність: без заліза / без відбитка / без згоди / без ключа', async () => {
    const noHardware = await biometricAvailability(
      fakeDevice({ hasHardwareAsync: async () => false })
    );
    const noEnroll = await biometricAvailability(
      fakeDevice({ isEnrolledAsync: async () => false })
    );
    const noConsent = await biometricAvailability(fakeDevice());
    expect([noHardware, noEnroll, noConsent]).toEqual([
      { available: false, reason: 'no_hardware' },
      { available: false, reason: 'not_enrolled' },
      { available: false, reason: 'not_enabled' },
    ]);

    const withKey = fakeDevice();
    await enableBiometricLogin(withKey, 'seed');
    expect(await biometricAvailability(withKey)).toEqual({ available: true });
  });

  it('успішний вхід обмінює ключ на сесію', async () => {
    const port = fakeDevice();
    await enableBiometricLogin(port, 'seed-42');
    const exchange = jest.fn(async (token: string) => ({ accessToken: `access:${token}` }));

    const result = await signInWithBiometrics(port, exchange);

    expect(exchange).toHaveBeenCalledWith('seed-42');
    expect(result).toEqual({ ok: true, session: { accessToken: 'access:seed-42' } });
  });

  it('відмова користувача не обмінює ключ', async () => {
    const port = fakeDevice({
      authenticateAsync: async () => ({ success: false, error: 'CANCELLED' }),
    });
    await enableBiometricLogin(port, 'seed');
    const exchange = jest.fn(async () => ({ accessToken: 'x' }));

    expect(await signInWithBiometrics(port, exchange)).toEqual({ ok: false, reason: 'cancelled' });
    expect(exchange).not.toHaveBeenCalled();
  });

  it('зниклий ключ прибирає згоду і просить OTP', async () => {
    const port = fakeDevice();
    await enableBiometricLogin(port, 'seed');
    // ключ зник між вмиканням і входом (наприклад, скидання Keychain)
    const half = {
      ...port,
      getSecureToken: async () => null,
      getBiometricEnabled: async () => true,
    };
    const exchange = jest.fn(async () => ({ accessToken: 'x' }));

    expect(await signInWithBiometrics(half, exchange)).toEqual({ ok: false, reason: 'no_key' });
    expect(await port.getBiometricEnabled()).toBe(false);
  });

  it('помилка обміну лишає згоду (повторний запит можливий)', async () => {
    const port = fakeDevice();
    await enableBiometricLogin(port, 'seed');
    const exchange = jest.fn(async () => {
      throw new Error('expired');
    });

    expect(await signInWithBiometrics(port, exchange)).toEqual({
      ok: false,
      reason: 'exchange_failed',
    });
    expect(await port.getBiometricEnabled()).toBe(true);
  });
});
