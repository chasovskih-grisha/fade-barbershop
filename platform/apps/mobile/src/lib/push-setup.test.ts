import type * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '@/lib/push-setup';
import * as pushToken from '@/lib/push-token';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
  IosAuthorizationStatus: { DENIED: 0, PROVISIONAL: 1, GRANTED: 2 },
}));

jest.mock('expo-constants', () => ({ platform: { android: false, ios: true } }));

interface MockNotifications {
  getPermissionsAsync: jest.Mock;
  requestPermissionsAsync: jest.Mock;
  getExpoPushTokenAsync: jest.Mock;
  setNotificationChannelAsync: jest.Mock;
}

const notifications = jest.requireMock('expo-notifications') as MockNotifications;
const configured = jest.spyOn(pushToken, 'pushProjectConfigured');

describe('T-070: push permission denied on device', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configured.mockReturnValue(true);
  });

  it('surfaces an already denied permission as an error without asking again', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({
      granted: false,
      ios: { status: 0 },
    } as Notifications.NotificationPermissionsStatus);

    await expect(registerForPushNotificationsAsync()).rejects.toThrow(
      'Push notifications: permission denied'
    );
    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('requests an undetermined permission and reports the denial', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({
      granted: false,
    } as Notifications.NotificationPermissionsStatus);
    notifications.requestPermissionsAsync.mockResolvedValue({
      granted: false,
      ios: { status: 0 },
    } as Notifications.NotificationPermissionsStatus);

    await expect(registerForPushNotificationsAsync()).rejects.toThrow(
      'Push notifications: permission denied'
    );
    expect(notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('returns an Expo token on granted permission', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({
      granted: true,
      ios: { status: 2 },
    } as Notifications.NotificationPermissionsStatus);
    notifications.getExpoPushTokenAsync.mockResolvedValue({
      data: 'ExpoPushToken[real-device]',
    });

    const token = await registerForPushNotificationsAsync();

    expect(token).toBe('ExpoPushToken[real-device]');
    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(notifications.getExpoPushTokenAsync).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: expect.any(String) })
    );
  });

  it('returns an empty string when the token payload is not a string', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({
      granted: true,
      ios: { status: 2 },
    } as Notifications.NotificationPermissionsStatus);
    notifications.getExpoPushTokenAsync.mockResolvedValue({ data: null });

    await expect(registerForPushNotificationsAsync()).resolves.toBe('');
  });

  it('returns an empty string when the token request fails', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({
      granted: true,
      ios: { status: 2 },
    } as Notifications.NotificationPermissionsStatus);
    notifications.getExpoPushTokenAsync.mockRejectedValue(new Error('network error'));

    await expect(registerForPushNotificationsAsync()).resolves.toBe('');
  });

  it('refuses to register without an EAS project id', async () => {
    configured.mockReturnValue(false);

    await expect(registerForPushNotificationsAsync()).rejects.toThrow(
      'Push notifications: EAS_PROJECT_ID is not configured'
    );
    expect(notifications.getPermissionsAsync).not.toHaveBeenCalled();
  });
});
