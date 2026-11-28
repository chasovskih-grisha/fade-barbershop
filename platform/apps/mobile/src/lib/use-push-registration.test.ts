import { renderHook, act } from '@testing-library/react-native';
import { usePushRegistration } from '@/lib/use-push-registration';
import * as pushSetup from '@/lib/push-setup';
import { registerPushToken } from '@/lib/api/push-tokens';
import { revokePushToken } from '@/lib/push-revoke';

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
const mockedRevoke = revokePushToken as jest.MockedFunction<typeof revokePushToken>;

describe('T-070: usePushRegistration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing when there is no session token', async () => {
    const { result } = renderHook(() => usePushRegistration());

    await act(async () => {
      await result.current.register('');
    });

    expect(mockedPushSetup.registerForPushNotificationsAsync).not.toHaveBeenCalled();
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it('registers a real Expo token after a session exists (from hook test)', async () => {
    mockedPushSetup.registerForPushNotificationsAsync.mockResolvedValue('ExpoPushToken[device-1]');

    const { result } = renderHook(() => usePushRegistration());

    await act(async () => {
      await result.current.register('access-from-hook');
    });

    expect(mockedPushSetup.registerForPushNotificationsAsync).toHaveBeenCalled();
    expect(mockedRegister).toHaveBeenCalledWith(
      'access-from-hook',
      'ExpoPushToken[device-1]',
      'ios'
    );
    expect(result.current.error).toBeNull();
  });

  it('registers a real Expo token after a session exists', async () => {
    mockedPushSetup.registerForPushNotificationsAsync.mockResolvedValue('ExpoPushToken[device-1]');

    const { result } = renderHook(() => usePushRegistration());

    await act(async () => {
      await result.current.register('access-1');
    });

    expect(mockedPushSetup.registerForPushNotificationsAsync).toHaveBeenCalled();
    expect(mockedRegister).toHaveBeenCalledWith('access-1', 'ExpoPushToken[device-1]', 'ios');
    expect(result.current.error).toBeNull();
  });

  it('handles denied push permission without hiding the failure', async () => {
    mockedPushSetup.registerForPushNotificationsAsync.mockRejectedValue(
      new Error('Push notifications: permission denied')
    );

    const { result } = renderHook(() => usePushRegistration());

    await act(async () => {
      await result.current.register('access-1');
    });

    expect(mockedRegister).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Сповіщення вимкнено на цьому пристрої');
  });

  it('idempotent: does not re-register the same session token', async () => {
    mockedPushSetup.registerForPushNotificationsAsync.mockResolvedValue('ExpoPushToken[device-1]');

    const { result } = renderHook(() => usePushRegistration());

    await act(async () => {
      await result.current.register('access-1');
      await result.current.register('access-1');
    });

    expect(mockedRegister).toHaveBeenCalledTimes(1);
  });

  it('re-registers after the session token changes', async () => {
    mockedPushSetup.registerForPushNotificationsAsync.mockResolvedValue('ExpoPushToken[device-1]');

    const { result } = renderHook(() => usePushRegistration());

    await act(async () => {
      await result.current.register('access-1');
    });
    expect(mockedRegister).toHaveBeenCalledWith('access-1', 'ExpoPushToken[device-1]', 'ios');

    // New session — push setup is called again so the server rebinds the row.
    mockedPushSetup.registerForPushNotificationsAsync.mockResolvedValueOnce(
      'ExpoPushToken[device-2]'
    );
    await act(async () => {
      await result.current.register('access-2');
    });

    expect(mockedRegister).toHaveBeenLastCalledWith('access-2', 'ExpoPushToken[device-2]', 'ios');
    expect(result.current.error).toBeNull();

    // revoke not called in this flow — only register is exercised here.
    expect(mockedRevoke).not.toHaveBeenCalled();
  });

  it('revoke calls the server revoke endpoint and clears the local error', async () => {
    const { result } = renderHook(() => usePushRegistration());

    await act(async () => {
      await result.current.revoke('ExpoPushToken[device-1]');
    });

    expect(mockedRevoke).toHaveBeenCalledWith('ExpoPushToken[device-1]');
    expect(result.current.error).toBeNull();
  });
});
