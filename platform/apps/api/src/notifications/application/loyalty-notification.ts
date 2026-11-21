/* eslint-disable complexity -- 1 function with inherent domain branching (worst: an existing definition, complexity 14 vs 10); refactor tracked in T-2500f */
import type {
  LoyaltyNotificationDeps,
  LoyaltyNotificationEvent,
} from './loyalty-notification-ports';
import {
  renderCounterIncrementedSms,
  renderFreeVisitGrantedSms,
} from './loyalty-notification-template';
import type { HandleOutcome, NotificationEvent } from './send-booking-confirmation';

export class LoyaltyNotificationHandler {
  constructor(private readonly deps: LoyaltyNotificationDeps) {}

  async handleOne(event: NotificationEvent): Promise<HandleOutcome> {
    if (
      event.type !== 'loyalty.counter.incremented' &&
      event.type !== 'loyalty.free_visit.granted'
    ) {
      return { handled: false, reason: 'ignored' };
    }
    if (await this.deps.journal.alreadyHandled(event.id)) {
      return { handled: false, reason: 'duplicate' };
    }

    const payload = event.payload as LoyaltyNotificationEvent['payload'];
    const { clientId } = payload;

    if (this.deps.preferences && (await this.deps.preferences.isOptedOut(clientId))) {
      await this.deps.journal.markSent({
        eventId: event.id,
        type: event.type,
        channel: 'none',
        recipient: '',
        subject: '',
        detail: 'клієнт відписався від сповіщень лояльності',
      });
      return { handled: true, reason: 'skipped' };
    }

    const phone = await this.deps.clients.findPhoneByClientId(clientId);
    const tokens = await this.deps.devices.findTokensByUserId(clientId);

    let messageText = '';
    if (event.type === 'loyalty.free_visit.granted') {
      messageText = renderFreeVisitGrantedSms();
    } else {
      const newCount = payload.newCount ?? 1;
      messageText = renderCounterIncrementedSms(newCount);
    }

    let sentChannel = 'none';
    if (phone) {
      await this.deps.sms.send({ to: phone, text: messageText });
      sentChannel = 'sms';
    }
    if (tokens.length > 0) {
      for (const token of tokens) {
        await this.deps.push.send([{ token, title: 'FADE Лояльність', body: messageText }]);
      }
      sentChannel = sentChannel === 'none' ? 'push' : 'sms+push';
    }

    if (sentChannel === 'none') {
      await this.deps.journal.markSent({
        eventId: event.id,
        type: event.type,
        channel: 'none',
        recipient: '',
        subject: '',
        detail: 'Контакти чи токени клієнта не знайдені',
      });
      return { handled: true, reason: 'skipped' };
    }

    await this.deps.journal.markSent({
      eventId: event.id,
      type: event.type,
      channel: sentChannel,
      recipient: phone ?? `${tokens.length} push tokens`,
      subject: 'Loyalty notification',
    });

    return { handled: true, reason: 'sent' };
  }
}
