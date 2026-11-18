// Порти push-каналу (T-070 mobile / T-4422 сповіщення безпеки).
// Сповіщення про новий вхід іде на ІНШІ пристрої клієнта: «канал дозволений»
// = пристрій зареєстрував Expo-токен (дозвіл дає ОС), а сесія цього пристрою
// ще активна. Провайдер добирається за PUSH_PROVIDER (патерн EMAIL_PROVIDER):
// console — дефолт dev, expo — реальна доставка.

export interface PushMessage {
  token: string;
  title: string;
  body: string;
}

export interface PushSender {
  send(messages: readonly PushMessage[]): Promise<void>;
}

export type PushProviderName = 'console' | 'expo';

/**
 * Токени інших пристроїв користувача (відраховуємо сесію, що щойно увійшла:
 * їй пуш не потрібен). Порожній список — канал не дозволений ніде.
 */
export interface DevicePushTokens {
  findOtherDeviceTokens(input: { userId: string; exceptSessionId: string }): Promise<string[]>;
  findTokensByUserId(userId: string): Promise<string[]>;
}
