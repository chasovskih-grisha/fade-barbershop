// SMS-повідомлення (T-080): підтвердження, нагадування, черга, no-show,
// маркетингові opt-in/out.
//
// Тут лише оркестрація: текст рендерять чисті функції
// (booking-confirmation-sms, appointment-reminder-sms, sms-messages), а
// контакти й налаштування приходять портами. Стара версія цього файлу
// ходила в prisma напряму, тягнула `any` і містила зіпсовані українські
// тексти («Слуга», «уважечого») — обидва шари тепер мають тести.
import { renderConfirmationSms, type SmsSender } from './booking-confirmation-sms';
import { renderReminderSms } from './appointment-reminder-sms';
import {
  renderMarketingOptInSms,
  renderMarketingOptOutSms,
  renderNoShowSms,
  renderWaitlistOfferExpiredSms,
  renderWaitlistOfferSms,
  renderWaitlistPositionSms,
  type NoShowSmsData,
  type WaitlistOfferSmsData,
  type WaitlistPositionSmsData,
} from './sms-messages';
import {
  buildConfirmationLetterData,
  type BookedPayload,
  type ClientContacts,
  type LocationContacts,
  type NotificationEvent,
  type ServiceCatalog,
} from './booking-confirmation-ports';
import type { ConfirmationLetterData } from './booking-confirmation-template';

export type { SmsInput, SmsSender } from './booking-confirmation-sms';

export interface SmsDispatchResult {
  success: boolean;
  detail: string;
}

/** Скільки хвилин до візиту нагадує типовий планувальник (24 год). */
export const DEFAULT_REMINDER_LEAD_MINUTES = 24 * 60;

/** Підтвердження запису. */
export class SendBookingConfirmationSms {
  constructor(private readonly sms: SmsSender) {}

  async send(to: string, data: ConfirmationLetterData): Promise<void> {
    await this.sms.send({ to, text: renderConfirmationSms(data) });
  }
}

/** Сумісна функціональна форма для споживачів, що не тримають клас. */
export async function sendBookingConfirmationSms(
  sms: SmsSender,
  to: string,
  data: ConfirmationLetterData
): Promise<void> {
  await new SendBookingConfirmationSms(sms).send(to, data);
}

/** Нагадування про візит (за замовчуванням — за 24 години). */
export class SendReminderSms {
  constructor(private readonly sms: SmsSender) {}

  async send(
    to: string,
    data: ConfirmationLetterData,
    leadMinutes: number = DEFAULT_REMINDER_LEAD_MINUTES
  ): Promise<void> {
    if (leadMinutes <= 0) {
      throw new Error(`Invalid reminder lead time: ${leadMinutes}`);
    }
    await this.sms.send({ to, text: renderReminderSms(data) });
  }
}

/** Позиція в черзі. */
export class SendWaitlistUpdateSms {
  constructor(private readonly sms: SmsSender) {}

  async send(to: string, data: WaitlistPositionSmsData): Promise<void> {
    await this.sms.send({ to, text: renderWaitlistPositionSms(data) });
  }
}

/** Пропозиція слота з тайм-аутом акцепту. */
export class SendWaitlistOfferSms {
  constructor(private readonly sms: SmsSender) {}

  async send(to: string, data: WaitlistOfferSmsData): Promise<void> {
    await this.sms.send({ to, text: renderWaitlistOfferSms(data) });
  }

  async sendExpired(to: string): Promise<void> {
    await this.sms.send({ to, text: renderWaitlistOfferExpiredSms() });
  }
}

/** NSH-007: нейтральне повідомлення про пропущений візит. */
export class SendNoShowSms {
  constructor(private readonly sms: SmsSender) {}

  async send(to: string, data: NoShowSmsData): Promise<void> {
    await this.sms.send({ to, text: renderNoShowSms(data) });
  }
}

/** Порт згоди на маркетингові SMS (crm зберігає прапорець). */
export interface MarketingSmsPreferences {
  setMarketingOptIn(clientId: string, optIn: boolean): Promise<void>;
}

/** Підтвердження запису з події `scheduling.appointment.booked`. */
export class BookingConfirmationHandler {
  constructor(
    private readonly sms: SmsSender,
    private readonly clients: ClientContacts,
    private readonly locations: LocationContacts,
    private readonly services?: ServiceCatalog
  ) {}

  async handle(event: NotificationEvent): Promise<SmsDispatchResult> {
    const payload = event.payload as BookedPayload;
    const phone = await this.clients.findPhoneByAppointmentId(event.aggregateId);
    if (!phone) return { success: false, detail: 'No phone number for client' };

    const contacts = await this.locations.findContacts(payload.locationId);
    const data = await buildConfirmationLetterData(payload, contacts, this.services);
    await new SendBookingConfirmationSms(this.sms).send(phone, data);
    return { success: true, detail: 'SMS confirmation sent' };
  }
}

/** Нагадування з тієї ж події, коли планувальник вирішив, що час настав. */
export class ReminderHandler {
  constructor(
    private readonly sms: SmsSender,
    private readonly clients: ClientContacts,
    private readonly locations: LocationContacts,
    private readonly services?: ServiceCatalog
  ) {}

  async handle(
    event: NotificationEvent,
    leadMinutes: number = DEFAULT_REMINDER_LEAD_MINUTES
  ): Promise<SmsDispatchResult> {
    const payload = event.payload as BookedPayload;
    const phone = await this.clients.findPhoneByAppointmentId(event.aggregateId);
    if (!phone) return { success: false, detail: 'No phone number for client' };

    const contacts = await this.locations.findContacts(payload.locationId);
    const data = await buildConfirmationLetterData(payload, contacts, this.services);
    await new SendReminderSms(this.sms).send(phone, data, leadMinutes);
    return { success: true, detail: 'SMS reminder sent' };
  }
}

/** Оновлення позиції в черзі (WTL). */
export class WaitlistUpdateHandler {
  constructor(
    private readonly sms: SmsSender,
    private readonly clients: ClientContacts
  ) {}

  async handle(event: NotificationEvent): Promise<SmsDispatchResult> {
    const payload = event.payload as Partial<WaitlistPositionSmsData>;
    const phone = await this.clients.findPhoneByAppointmentId(event.aggregateId);
    if (!phone) return { success: false, detail: 'No phone number for client' };

    await new SendWaitlistUpdateSms(this.sms).send(phone, {
      position: payload.position ?? 1,
      ...(payload.barberName ? { barberName: payload.barberName } : {}),
      ...(payload.serviceName ? { serviceName: payload.serviceName } : {}),
      ...(payload.locationName ? { locationName: payload.locationName } : {}),
    });
    return { success: true, detail: 'SMS waitlist update sent' };
  }
}

/** Маркетингові opt-in/opt-out: спершу згода в crm, потім підтвердження. */
export class MarketingSmsHandler {
  constructor(
    private readonly sms: SmsSender,
    private readonly preferences: MarketingSmsPreferences
  ) {}

  async handleOptIn(input: { clientId: string; phone: string }): Promise<SmsDispatchResult> {
    await this.preferences.setMarketingOptIn(input.clientId, true);
    await this.sms.send({ to: input.phone, text: renderMarketingOptInSms() });
    return { success: true, detail: 'SMS marketing opt-in recorded' };
  }

  async handleOptOut(input: { clientId: string; phone: string }): Promise<SmsDispatchResult> {
    await this.preferences.setMarketingOptIn(input.clientId, false);
    await this.sms.send({ to: input.phone, text: renderMarketingOptOutSms() });
    return { success: true, detail: 'SMS marketing opt-out recorded' };
  }
}
