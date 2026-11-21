// NewDeviceAlert (T-4422): сповіщення про новий вхід (identity.session.started)
// — email клієнта і push на ІНШІ пристрої того самого акаунта.
// Email — опційний канал (клієнт сам додає адресу в кабінеті); push —
// «дозволений» рівно тоді, коли інший пристрій зареєстрував Expo-токен і його
// сесія ще активна (дозвіл видає ОС). Жоден канал не налаштований — подія
// обробляється як skipped (свідома відмова, не помилка); журнал один рядок
// на eventId, тому канал запису — 'email', 'push', 'email+push' або 'none'.
// Тіло людиною мовою, час — Europe/Kyiv (патерн template T-4608).

import type { PushMessage } from './push-ports';
import type { SecurityAlertDeps, SecurityAlertEvent } from './security-alert-ports';
import {
  alertSubject,
  emailHtml,
  emailText,
  pushBody,
  PUSH_TITLE,
} from './security-alert-messages';

export interface HandleAlertOutcome {
  handled: boolean;
  reason: 'sent' | 'duplicate' | 'skipped' | 'ignored';
}

export type { SecurityAlertDeps };

export class NewDeviceAlert {
  constructor(private readonly deps: SecurityAlertDeps) {}

  async handleOne(event: SecurityAlertEvent): Promise<HandleAlertOutcome> {
    if (event.type !== 'identity.session.started') return { handled: false, reason: 'ignored' };
    if (await this.deps.journal.alreadyHandled(event.id))
      return { handled: false, reason: 'duplicate' };

    const { userId, sessionId } = event.payload;
    const email = await this.deps.users.findEmailByUserId(userId);
    const tokens = await this.deps.devices.findOtherDeviceTokens({
      userId,
      exceptSessionId: sessionId,
    });

    // Обидва канали — «найкраще зусилля» на пристрій: падіння send лишає подію
    // pending (at-least-once), журнал пишемо ПІСЛЯ успішних відправок.
    if (email)
      await this.deps.email.send({
        to: email,
        subject: alertSubject(),
        text: emailText(event),
        html: emailHtml(event),
      });
    if (tokens.length > 0) await this.deps.push.send(this.pushMessages(tokens, event));

    const channels = [email ? 'email' : null, tokens.length > 0 ? 'push' : null].filter(
      (channel): channel is string => channel !== null
    );
    if (channels.length === 0) {
      await this.deps.journal.markSent({
        eventId: event.id,
        type: event.type,
        channel: 'none',
        recipient: '',
        subject: '',
        detail: 'email і push-канал не задано — сповіщення вимкнені',
      });
      return { handled: true, reason: 'skipped' };
    }

    await this.deps.journal.markSent({
      eventId: event.id,
      type: event.type,
      channel: channels.join('+'),
      recipient: email ?? `${tokens.length} пристроїв`,
      subject: email ? alertSubject() : PUSH_TITLE,
    });
    return { handled: true, reason: 'sent' };
  }

  private pushMessages(tokens: readonly string[], event: SecurityAlertEvent): PushMessage[] {
    return tokens.map((token) => ({ token, title: PUSH_TITLE, body: pushBody(event) }));
  }
}
