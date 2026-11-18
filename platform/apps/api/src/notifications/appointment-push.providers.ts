// Провайдери push-каналу візиту (T-080): адаптер відписки та споживач подій
// життєвого циклу запису. Винесено з notifications.providers.ts за LOC-гейтом
// (патерн appointment-reminder.providers.ts); маршрут — outbox-routing.ts.
import { PrismaNotificationJournal } from './infrastructure/notification-journal';
import { PrismaClientContacts } from './infrastructure/client-contacts';
import { PrismaDevicePushTokens } from './infrastructure/device-push-tokens';
import { PrismaClientPushPreferences } from './infrastructure/client-push-preferences';
import { AppointmentPushNotification, type AppointmentPushDeps } from './application/appointment-push';
import { PUSH_SENDER } from './notifications.tokens';

/** Push-канал візиту (T-080): push на пристрої клієнта, відписка поважається. */
export const AppointmentPushProvider = {
  provide: AppointmentPushNotification,
  useFactory: (...deps: unknown[]) => {
    const [push, devices, clients, preferences, journal] = deps as [
      AppointmentPushDeps['push'],
      AppointmentPushDeps['devices'],
      AppointmentPushDeps['clients'],
      AppointmentPushDeps['preferences'],
      AppointmentPushDeps['journal'],
    ];
    return new AppointmentPushNotification({ push, devices, clients, preferences, journal });
  },
  inject: [
    PUSH_SENDER,
    PrismaDevicePushTokens,
    PrismaClientContacts,
    PrismaClientPushPreferences,
    PrismaNotificationJournal,
  ],
};

export const appointmentPushProviders = [PrismaClientPushPreferences, AppointmentPushProvider];
