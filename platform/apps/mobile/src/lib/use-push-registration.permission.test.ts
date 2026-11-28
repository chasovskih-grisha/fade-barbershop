import { renderHook, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { usePushRegistration } from '@/lib/use-push-registration';
import * as pushSetup from '@/lib/push-setup';
import { registerPushToken } from '@/lib/api/push-tokens';

// T-070 (reopened): відмова в дозволі не блокує повторну спробу, платформа
// пристрою не підміняється «ios», порожній токен не закриває сеанс назавжди.

jest.mock('@/lib/push-setup', () => ({
  registerForPushNotificationsAsync: jest.fn(),
}));

jest.mock('@/lib/api/push-tokens', () => ({
  registerPushToken: jest.fn(async () => {}),
}));

jest.mock('@/lib/push-revoke', () => ({
  revokePushToken: jest.fn(async () => {}),
}));

const mockedPushSetup = pushSetup as jest.Mocked<typeof pushSetup>;
const mockedRegister = registerPushToken as jest.MockedFunction<typeof registerPushToken>;

describe('T-070: push registration permission states', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reports the device platform, not a hardcoded ios (Android build)', async () => {
    mockedPushSetup.registerForPushNotificationsAsync.mockResolvedValue('ExpoPushToken[android-1]');
    const original = Platform.OS;
    Object.defineProperty(Platform, 'OS', { get: () => 'android', configurable: true });

    try {
      const { result } = renderHook(() => usePushRegistration());
      await act(async () => {
        await result.current.register('access-android');
      });

      expect(mockedRegister).toHaveBeenCalledWith(
        'access-android',
        'ExpoPushToken[android-1]',
        'android'
      );
    } finally {
      Object.defineProperty(Platform, 'OS', { get: () => original, configurable: true });
    }
  });

  it('після відмови в дозволі дозволяє повторну спробу тим самим сеансом', async () => {
    mockedPushSetup.registerForPushNotificationsAsync.mockRejectedValueOnce(
      new Error('Push notifications: permission denied')
    );

    const { result } = renderHook(() => usePushRegistration());
    await act(async () => {
      await result.current.register('access-retry');
    });
    expect(result.current.error).toBe('Сповіщення вимкнено на цьому пристрої');
    expect(mockedRegister).not.toHaveBeenCalled();

    // Людина ввімкнула дозвіл у налаштуваннях і натиснула «Увімкнути».
    mockedPushSetup.registerForPushNotificationsAsync.mockResolvedValueOnce(
      'ExpoPushToken[device-retry]'
    );
    await act(async () => {
      await result.current.register('access-retry');
    });

    expect(mockedRegister).toHaveBeenCalledWith(
      'access-retry',
      'ExpoPushToken[device-retry]',
      'ios'
    );
    expect(result.current.error).toBeNull();
  });

  it('порожній токен не блокує наступну спробу', async () => {
    mockedPushSetup.registerForPushNotificationsAsync.mockResolvedValueOnce('');

    const { result } = renderHook(() => usePushRegistration());
    await act(async () => {
      await result.current.register('access-empty');
    });
    expect(mockedRegister).not.toHaveBeenCalled();

    mockedPushSetup.registerForPushNotificationsAsync.mockResolvedValueOnce(
      'ExpoPushToken[device-late]'
    );
    await act(async () => {
      await result.current.register('access-empty');
    });

    expect(mockedRegister).toHaveBeenCalledTimes(1);
  });
});
