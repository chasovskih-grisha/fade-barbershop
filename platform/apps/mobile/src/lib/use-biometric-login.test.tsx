// T-4426: екранний шар біометричного входу — реальний `biometricsService`
// (fake-порт пристрою) і підмінений лише HTTP-обмін сесії.
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { biometricsService } from './biometrics';
import { useBiometricLogin } from './use-biometric-login';
import { refreshSession } from './api/identity';

jest.mock('./api/identity', () => ({
  refreshSession: jest.fn(async (token: string) => ({
    accessToken: `access:${token}`,
    refreshToken: `${token}:rotated`,
  })),
}));

describe('useBiometricLogin (T-4426)', () => {
  beforeEach(async () => {
    (refreshSession as jest.Mock).mockClear();
    biometricsService._setMockState(true, true);
    await biometricsService.invalidate();
  });

  it('після OTP ключ збережено і вхід доступний', async () => {
    const onSession = jest.fn();
    const { result } = renderHook(() => useBiometricLogin(onSession));

    await act(async () => {
      await result.current.remember('refresh-seed');
    });

    await waitFor(() => expect(result.current.available).toBe(true));
    expect(await biometricsService.getSecureToken()).toBe('refresh-seed');
  });

  it('натиск на біометрію віддає сесію з обміну', async () => {
    const onSession = jest.fn();
    const { result } = renderHook(() => useBiometricLogin(onSession));
    await act(async () => {
      await result.current.remember('seed-7');
    });

    await act(async () => {
      await result.current.signIn();
    });

    expect(refreshSession).toHaveBeenCalledWith('seed-7');
    expect(onSession).toHaveBeenCalledWith({
      accessToken: 'access:seed-7',
      refreshToken: 'seed-7:rotated',
    });
    expect(result.current.error).toBeNull();
  });

  it('без ключа вхід недоступний і показує причину', async () => {
    const onSession = jest.fn();
    const { result } = renderHook(() => useBiometricLogin(onSession));

    await act(async () => {
      await result.current.signIn();
    });

    expect(result.current.available).toBe(false);
    expect(result.current.error).toMatch(/недоступний/);
    expect(onSession).not.toHaveBeenCalled();
  });

  it('вихід прибирає біометричний ключ', async () => {
    const onSession = jest.fn();
    const { result } = renderHook(() => useBiometricLogin(onSession));
    await act(async () => {
      await result.current.remember('seed');
    });
    await waitFor(() => expect(result.current.available).toBe(true));

    await act(async () => {
      await result.current.forget();
    });

    expect(await biometricsService.getSecureToken()).toBeNull();
    expect(result.current.available).toBe(false);
  });

  it('пристрій без біометрії: доступність false, без помилки', async () => {
    biometricsService._setMockState(false, false);
    const { result } = renderHook(() => useBiometricLogin(jest.fn()));

    await waitFor(() => expect(result.current.available).toBe(false));
    expect(result.current.error).toBeNull();
  });
});
