// ExpoPushSender — реальний push-канал (Expo Push Service), патерн
// MailpitSmsSender: один HTTP-виклик, таймаут, помилку кидаємо назовні (релей
// лишає подію pending → повторна спроба, at-least-once). Expo приймає батч
// повідомлень; формат — { to, title, body } (docs.expo.dev/push-notifications).

import { Injectable, Logger } from '@nestjs/common';
import type { PushMessage, PushSender } from '../application/push-ports';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

@Injectable()
export class ExpoPushSender implements PushSender {
  private readonly logger = new Logger('PushSender');

  constructor(private readonly endpoint = EXPO_PUSH_URL) {}

  async send(messages: readonly PushMessage[]): Promise<void> {
    if (messages.length === 0) return;
    const payload = messages.map((message) => ({
      to: message.token,
      title: message.title,
      body: message.body,
      sound: 'default',
    }));
    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`Expo push HTTP ${res.status}`);
    } catch (error) {
      this.logger.error(
        'Expo push send failed: ' + (error instanceof Error ? error.message : String(error))
      );
      throw error;
    }
  }
}
