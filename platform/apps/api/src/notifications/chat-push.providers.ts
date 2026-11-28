// Провайдери push-каналу чату (T-081): споживач події messaging.message.created.
// Винесено з notifications.providers.ts за LOC-гейтом (патерн appointment-push).
import { PrismaNotificationJournal } from './infrastructure/notification-journal';
import { PrismaDevicePushTokens } from './infrastructure/device-push-tokens';
import { PrismaClientPushPreferences } from './infrastructure/client-push-preferences';
import { ChatPushNotification, type ChatPushDeps } from './application/chat-push';
import { PUSH_SENDER } from './notifications.tokens';

export const ChatPushProvider = {
  provide: ChatPushNotification,
  useFactory: (...deps: unknown[]) => {
    const [push, devices, preferences, journal] = deps as [
      ChatPushDeps['push'],
      ChatPushDeps['devices'],
      ChatPushDeps['preferences'],
      ChatPushDeps['journal'],
    ];
    return new ChatPushNotification({ push, devices, preferences, journal });
  },
  inject: [PUSH_SENDER, PrismaDevicePushTokens, PrismaClientPushPreferences, PrismaNotificationJournal],
};

export const chatPushProviders = [ChatPushProvider];
