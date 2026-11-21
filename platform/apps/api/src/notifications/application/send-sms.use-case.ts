/* eslint-disable max-lines, max-params -- cohesive module (206 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 4 signatures whose 4-param contract is fixed by existing call sites (worst: an existing definition, limit 3); API redesign tracked in T-2500f */
// SMS-повідомлення (T-080): підтвердження, нагадування, черга, no-show,
// маркетингові opt-in/out. Тексти рендерять чисті функції, контакти й
// каталог приходять портами. Сумісні фабрики збережено для WIP-споживачів.
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

/** Аліас, доданий у WIP; зберігаємо публічну назву порту. */
export type MarketingConsentWriter = MarketingSmsPreferences;

/** Вхід маркетингового opt-in/out: прямий або подійний (- WIP-сумісність). */
export type MarketingSmsInput =
  { clientId: string; phone: string } | { payload: { clientId: string; phone: string } };

function marketingInput(input: MarketingSmsInput): { clientId: string; phone: string } {
  return 'payload' in input ? input.payload : input;
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

  async handleOptIn(input: MarketingSmsInput): Promise<SmsDispatchResult> {
    const { clientId, phone } = marketingInput(input);
    await this.preferences.setMarketingOptIn(clientId, true);
    await this.sms.send({ to: phone, text: renderMarketingOptInSms() });
    return { success: true, detail: 'SMS marketing opt-in recorded' };
  }

  async handleOptOut(input: MarketingSmsInput): Promise<SmsDispatchResult> {
    const { clientId, phone } = marketingInput(input);
    await this.preferences.setMarketingOptIn(clientId, false);
    await this.sms.send({ to: phone, text: renderMarketingOptOutSms() });
    return { success: true, detail: 'SMS marketing opt-out recorded' };
  }
}

/** WIP-сумісний клас з початковою назвою (зберігаємо публічний експорт). */
export class SendSmketingSms {
  constructor(private readonly sms: SmsSender) {}

  async sendOptIn(to: string): Promise<void> {
    await this.sms.send({ to, text: renderMarketingOptInSms() });
  }

  async sendOptOut(to: string): Promise<void> {
    await this.sms.send({ to, text: renderMarketingOptOutSms() });
  }
}

/** Сумісні фабрики WIP-модулів. */
export function createBookingConfirmationHandler(
  sms: SmsSender,
  clients: ClientContacts,
  locations: LocationContacts,
  services?: ServiceCatalog
): BookingConfirmationHandler {
  return new BookingConfirmationHandler(sms, clients, locations, services);
}

export function createReminderHandler(
  sms: SmsSender,
  clients: ClientContacts,
  locations: LocationContacts,
  services?: ServiceCatalog
): ReminderHandler {
  return new ReminderHandler(sms, clients, locations, services);
}

export function createWaitlistUpdateHandler(
  sms: SmsSender,
  clients: ClientContacts
): WaitlistUpdateHandler {
  return new WaitlistUpdateHandler(sms, clients);
}

export function createMarketingSmsHandler(
  sms: SmsSender,
  consentOrPrisma: MarketingSmsPreferences | any
): MarketingSmsHandler {
  if (typeof consentOrPrisma?.setMarketingOptIn === 'function') {
    return new MarketingSmsHandler(sms, consentOrPrisma as MarketingSmsPreferences);
  }
  return new MarketingSmsHandler(sms, {
    setMarketingOptIn: async (clientId, optIn) => {
      const field = optIn ? 'smsMarketingOptIn' : 'smsMarketingOptOut';
      await consentOrPrisma.clientProfile.upsert({
        where: { clientId },
        update: { [field]: true },
        create: { clientId, [field]: true },
      });
    },
  });
}
