// Споживач подій outbox у контексті notifications (T-4608, патерн T-042c):
// `scheduling.appointment.booked` → підтвердження запису. Канал доставки —
// адмін-налаштування (email/sms/both/none, патерн MNG-ADM-18): email — «офіс
// запису» (email локації), sms — клієнту (Booking.clientId → User.phone);
// порти — booking-confirmation-ports.ts, доставка — delivery, канал-рішення —
// channels (LOC-гейт). Ідемпотентність — журнал з унікальним eventId; ретрай
// через at-least-once: падіння send лишає подію pending (журнал НЕ пишеться).
// Без Nest/Prisma: доменні конвенції контексту — інфраструктура окремо.

import { deliverByChannel } from './booking-confirmation-delivery';
import { decideChannel, missingRecipientDetail } from './booking-confirmation-channels';
import type {
  BookedPayload,
  NotificationEvent,
  NotificationRecordInput,
  BookingConfirmationDeps,
} from './booking-confirmation-ports';
import { BOOKED_EVENT_TYPE, buildConfirmationLetterData } from './booking-confirmation-ports';

export { BOOKED_EVENT_TYPE } from './booking-confirmation-ports';
// prettier-ignore
export type {
  NotificationEvent, NotificationRecordInput, NotificationJournal,
  LocationContacts, ServiceCatalog, ClientContacts, BookingConfirmationDeps,
} from './booking-confirmation-ports';

/** Канал + одержувач для запису журналу (bundle-параметри, гейт max-params). */
type MarkInput = { channel: string; recipient: string; detail?: string };

export interface HandleOutcome {
  handled: boolean;
  reason: 'sent' | 'duplicate' | 'skipped' | 'ignored';
  recipient?: string;
}

export class SendBookingConfirmation {
  constructor(private readonly deps: BookingConfirmationDeps) {}

  async handleOne(event: NotificationEvent): Promise<HandleOutcome> {
    if (event.type !== BOOKED_EVENT_TYPE) return { handled: false, reason: 'ignored' };
    if (await this.deps.journal.alreadyHandled(event.id))
      return { handled: false, reason: 'duplicate' };

    const decision = decideChannel((await this.deps.settings.get()).channel);
    if (decision.kind === 'disabled') {
      // Свідома вимкнена доставка: журнал займає eventId, щоб повторна
      // доставка не спамити діагностику.
      await this.mark(event, {
        channel: 'none',
        recipient: '',
        detail: 'канал вимкнено в адмінці',
      });
      return { handled: true, reason: 'skipped' };
    }
    const { channel } = decision;

    const payload = event.payload as BookedPayload;
    const contacts = await this.deps.locations.findContacts(payload.locationId);
    const letterData = await buildConfirmationLetterData(payload, contacts, this.deps.services);
    const delivered = await deliverByChannel(this.deps, {
      channel,
      appointmentId: event.aggregateId,
      contacts,
      letterData,
    });
    if (delivered !== null) {
      await this.mark(event, {
        channel,
        recipient: delivered.recipient,
        detail: delivered.detail,
      });
      return { handled: true, reason: 'sent', recipient: delivered.recipient };
    }
    // Немає одержувача — свідома відмова, не збій (eventId зайнятий журналом).
    await this.mark(event, {
      channel,
      recipient: '',
      detail: missingRecipientDetail(channel, payload.locationId),
    });
    return { handled: true, reason: 'skipped' };
  }

  /** Запис журналу: bundle-параметри (гейт max-params). */
  private async mark(event: NotificationEvent, record: MarkInput): Promise<void> {
    const input: NotificationRecordInput = {
      eventId: event.id,
      type: event.type,
      channel: record.channel,
      recipient: record.recipient,
      subject: record.channel === 'email' ? 'confirmation' : '',
      ...(record.detail ? { detail: record.detail } : {}),
    };
    await this.deps.journal.markSent(input);
  }
}
