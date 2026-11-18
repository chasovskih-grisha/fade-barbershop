// Споживач push-каналу візиту (T-080): booked/rescheduled/cancelled → push на
// пристрої клієнта (findTokensByUserId). Відписка клієнта (pushEnabled=false у
// кабінеті) поважається; журнал з унікальним eventId не дублює доставку, а
// падіння send лишає подію pending (at-least-once). Тексти — appointment-push-messages.
import { PUSH_EVENT_TYPES, type AppointmentPushDeps, type PushEventType } from './appointment-push-ports';
import { pushBody, pushTitle } from './appointment-push-messages';
import type { HandleOutcome, NotificationEvent } from './send-booking-confirmation';

export type { AppointmentPushDeps } from './appointment-push-ports';

function isPushEvent(type: string): type is PushEventType {
  return (PUSH_EVENT_TYPES as readonly string[]).includes(type);
}

export class AppointmentPushNotification {
  constructor(private readonly deps: AppointmentPushDeps) {}

  async handleOne(event: NotificationEvent): Promise<HandleOutcome> {
    const type = event.type;
    if (!isPushEvent(type)) return { handled: false, reason: 'ignored' };
    if (await this.deps.journal.alreadyHandled(event.id))
      return { handled: false, reason: 'duplicate' };

    const clientId = await this.deps.clients.findClientIdByAppointmentId(event.aggregateId);
    if (!clientId) return this.skip(event, 'запис без клієнта — push нема кому слати');
    if (!(await this.deps.preferences.isPushEnabled(clientId)))
      return this.skip(event, 'клієнт вимкнув push у кабінеті');

    const tokens = await this.deps.devices.findTokensByUserId(clientId);
    if (tokens.length === 0) return this.skip(event, 'у клієнта немає зареєстрованих пристроїв');

    const payload = (event.payload ?? {}) as { start?: string };
    const title = pushTitle(type);
    await this.deps.push.send(
      tokens.map((token) => ({ token, title, body: pushBody(type, payload) }))
    );
    const recipient = `${tokens.length} пристроїв`;
    await this.deps.journal.markSent({
      eventId: event.id,
      type: event.type,
      channel: 'push',
      recipient,
      subject: title,
    });
    return { handled: true, reason: 'sent', recipient };
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
