// Push нового повідомлення чату (T-081): подія messaging.message.created →
// пристрої співрозмовника. Відписка клієнта поважається; журнал з тим самим
// eventId не дублює доставку; тексти українською, тіло — прев'ю повідомлення.
import type { HandleOutcome, NotificationEvent } from './send-booking-confirmation';
import type { ClientPushPreferences } from './appointment-push-ports';
import type { DevicePushTokens, PushSender } from './push-ports';
import type { NotificationJournal } from './booking-confirmation-ports';

export const CHAT_MESSAGE_EVENT = 'messaging.message.created';
const PREVIEW_LIMIT = 120;

export type ChatPushDeps = {
  push: PushSender;
  devices: DevicePushTokens;
  preferences: ClientPushPreferences;
  journal: NotificationJournal;
};

type ChatPayload = { recipientId?: string; senderRole?: string; preview?: string };

export function chatPushTitle(senderRole: string | undefined): string {
  return senderRole === 'barber' ? 'FADE: повідомлення від барбера' : 'FADE: нове повідомлення';
}

export function chatPushBody(senderRole: string | undefined, preview: string | undefined): string {
  const text = String(preview ?? '').trim();
  const who = senderRole === 'barber' ? 'Барбер' : 'Клієнт';
  return text ? `${who}: ${text.slice(0, PREVIEW_LIMIT)}` : `${who} надіслав повідомлення у чат візиту.`;
}

export class ChatPushNotification {
  constructor(private readonly deps: ChatPushDeps) {}

  async handleOne(event: NotificationEvent): Promise<HandleOutcome> {
    if (event.type !== CHAT_MESSAGE_EVENT) return { handled: false, reason: 'ignored' };
    if (await this.deps.journal.alreadyHandled(event.id))
      return { handled: false, reason: 'duplicate' };

    const payload = (event.payload ?? {}) as ChatPayload;
    const recipientId = payload.recipientId?.trim();
    if (!recipientId) return this.skip(event, 'подія без отримувача');
    if (!(await this.deps.preferences.isPushEnabled(recipientId)))
      return this.skip(event, 'отримувач вимкнув push');
    const tokens = await this.deps.devices.findTokensByUserId(recipientId);
    if (tokens.length === 0) return this.skip(event, 'немає зареєстрованих пристроїв');

    const title = chatPushTitle(payload.senderRole);
    const body = chatPushBody(payload.senderRole, payload.preview);
    await this.deps.push.send(tokens.map((token) => ({ token, title, body })));
    await this.deps.journal.markSent({
      eventId: event.id,
      type: event.type,
      channel: 'push',
      recipient: `${tokens.length} пристроїв`,
      subject: title,
    });
    return { handled: true, reason: 'sent', recipient: `${tokens.length} пристроїв` };
  }

  private async skip(event: NotificationEvent, detail: string): Promise<HandleOutcome> {
    await this.deps.journal.markSent({
      eventId: event.id,
      type: event.type,
      channel: 'none',
      recipient: '',
      subject: '',
      detail,
    });
    return { handled: true, reason: 'skipped' };
  }
}
