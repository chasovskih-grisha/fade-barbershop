// Споживач відкладеної події нагадування (T-080): «notification.reminder.due»,
// яку релей бачить лише після availableAt → SMS клієнту (Booking.clientId →
// User.phone) з часом, місцем і послугою візиту. Канал — адмін-налаштування
// (sms|none); журнал із унікальним eventId не дає дублювати доставку, а
// падіння send лишає подію pending — ретрай на наступному тіку (at-least-once).

import { REMINDER_DUE_EVENT_TYPE, type ReminderDuePayload } from './appointment-reminder-ports';
import { renderReminderSms } from './appointment-reminder-sms';
import type { SmsSender } from './booking-confirmation-sms';
import type { HandleOutcome } from './send-booking-confirmation';
import { buildConfirmationLetterData, type ClientContacts, type LocationContacts, type NotificationEvent, type NotificationJournal, type NotificationRecordInput, type ServiceCatalog } from './booking-confirmation-ports';
import type { AppointmentReminderSettingsPort } from '../domain/appointment-reminder-settings';

export interface SendAppointmentReminderDeps {
  sms: SmsSender;
  journal: NotificationJournal;
  clients: ClientContacts;
  locations: LocationContacts;
  settings: AppointmentReminderSettingsPort;
  preferences?: {
    getPreferences(clientId: string): Promise<{ reminderOptOut?: boolean; smsEnabled?: boolean }>;
    isOptedOut(clientId: string): Promise<boolean>;
  };
  /** Опційний: без нього нагадування без назви послуги. */
  services?: ServiceCatalog;
}

export class SendAppointmentReminder {
  constructor(private readonly deps: SendAppointmentReminderDeps) {}

  async handleOne(event: NotificationEvent): Promise<HandleOutcome> {
    if (event.type !== REMINDER_DUE_EVENT_TYPE) return { handled: false, reason: 'ignored' };
    if (await this.deps.journal.alreadyHandled(event.id))
      return { handled: false, reason: 'duplicate' };

    const settings = await this.deps.settings.get();
    if (settings.channel === 'none') return this.skip(event, 'канал нагадувань вимкнено в адмінці');

    const payload = (event.payload ?? {}) as ReminderDuePayload;
    const appointmentId = payload.appointmentId ?? event.aggregateId;

    if (this.deps.preferences && this.deps.clients.findClientIdByAppointmentId) {
      const clientId = await this.deps.clients.findClientIdByAppointmentId(appointmentId);
      if (clientId) {
        const prefs = await this.deps.preferences.getPreferences(clientId);
        if (prefs.reminderOptOut || prefs.smsEnabled === false) {
          return this.skip(event, 'клієнт відмовився від нагадувань або вимкнув SMS');
        }
      }
    }

    const phone = await this.deps.clients.findPhoneByAppointmentId(appointmentId);
    if (!phone) return this.skip(event, 'немає телефону клієнта для нагадування');

    const data = await this.reminderText(payload);
    await this.deps.sms.send({ to: phone, text: renderReminderSms(data) });
    await this.mark(event, phone, payload.fireAt);
    return { handled: true, reason: 'sent', recipient: phone };
  }

  /** Дані тексту: контакти локації + назва послуги + час візиту. */
  private async reminderText(payload: ReminderDuePayload) {
    const contacts = payload.locationId
      ? await this.deps.locations.findContacts(payload.locationId)
      : null;
    return buildConfirmationLetterData(
      {
        // locationId у нагадуванні необов'язковий; без нього контакти вже не
        // резолвилися, тож порожній рядок лише для сигнатури BookedPayload.
        locationId: payload.locationId ?? '',
        ...(payload.start ? { start: payload.start } : {}),
        ...(payload.serviceId ? { serviceId: payload.serviceId } : {}),
      },
      contacts,
      this.deps.services
    );
  }

  /** Свідома відмова: eventId займає журнал, щоб ретрай не спамив діагностику. */
  private async skip(event: NotificationEvent, detail: string): Promise<HandleOutcome> {
    await this.mark(event, '', detail);
    return { handled: true, reason: 'skipped' };
  }

  private async mark(event: NotificationEvent, recipient: string, detail: string): Promise<void> {
    const input: NotificationRecordInput = {
      eventId: event.id,
      type: event.type,
      channel: recipient ? 'sms' : 'none',
      recipient,
      subject: '',
      detail,
    };
    await this.deps.journal.markSent(input);
  }
}
