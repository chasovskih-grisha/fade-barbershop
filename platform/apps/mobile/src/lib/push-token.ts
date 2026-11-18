import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export const EAS_PROJECT_ID =
  Constants.expoConfig?.extra?.eas?.projectId ??
  Constants.easConfig?.projectId ??
  'PLACEHOLDER_EAS_PROJECT_ID';

export function pushProjectConfigured(): boolean {
  return Boolean(EAS_PROJECT_ID) && EAS_PROJECT_ID !== 'PLACEHOLDER_EAS_PROJECT_ID';
}

export function isPushAllowed(status: Notifications.NotificationPermissionsStatus | null): boolean {
  if (!status) return false;
  return (
    Boolean(status.granted) ||
    status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function getExpoPushToken(): Promise<string | null> {
  if (!pushProjectConfigured()) return null;
  try {
    const expoToken = await Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID });
    return expoToken.data;
  } catch {
    return null;
  }
}
