// Порти споживача підтверджень (T-4608): контакти, журнал, каталог, депси.
// Виділено з send-booking-confirmation за LOC-гейтом; контракт не змінено.
import type { ConfirmationLetterData } from './booking-confirmation-template';
import type { EmailSender } from '../../shared/email/ports';
import type { SmsSender } from './booking-confirmation-sms';
import type { BookingConfirmationSettingsPort } from '../domain/booking-confirmation-settings';

export const BOOKED_EVENT_TYPE = 'scheduling.appointment.booked';

/** Payload події `scheduling.appointment.booked`; час — ISO-рядки (опційні). */
export interface BookedPayload {
  locationId: string;
  barberId?: string;
  serviceId?: string;
  start?: string;
  end?: string;
}

export interface NotificationEvent {
  id: string;
  type: string;
  /** aggregateId події = appointmentId (агрегат живе на рядку Booking). */
  aggregateId: string;
  payload: unknown;
}

export interface NotificationRecordInput {
  eventId: string;
  type: string;
  /** Канал запису журналу: email|sms|both|none — налагодження доставок. */
  channel: string;
  recipient: string;
  subject: string;
  detail?: string;
}

export interface NotificationJournal {
  alreadyHandled(eventId: string): Promise<boolean>;
  markSent(record: NotificationRecordInput): Promise<void>;
}

export interface LocationContacts {
  /** Ім'я, адреса і email локації; null — локації немає. */
  findContacts(
    locationId: string
  ): Promise<{ name: string; address: string | null; email: string | null } | null>;
}

/** Назва послуги для листа; null — рядок «Послуга» не рендериться. */
export interface ServiceCatalog {
  findName(serviceId: string): Promise<string | null>;
}

/** Телефон клієнта запису; null — SMS нема кому слати. */
export interface ClientContacts {
  findPhoneByAppointmentId(appointmentId: string): Promise<string | null>;
  findClientIdByAppointmentId(appointmentId: string): Promise<string | null>;
}

export interface BookingConfirmationDeps {
  email: EmailSender;
  sms: SmsSender;
  locations: LocationContacts;
  clients: ClientContacts;
  journal: NotificationJournal;
  settings: BookingConfirmationSettingsPort;
  /** Опційний: без нього лист без назви послуги (подія не несе serviceId). */
  services?: ServiceCatalog;
}

/** Дані листа з payload події + контакти локації: undefined-поля не потрапляють
 *  (exactOptionalPropertyTypes); serviceName — лише коли є каталог і serviceId. */
export async function buildConfirmationLetterData(
  payload: BookedPayload,
  contacts: { name: string; address: string | null; email: string | null } | null,
  services: ServiceCatalog | undefined
): Promise<ConfirmationLetterData> {
  const serviceName =
    services && payload.serviceId ? await services.findName(payload.serviceId) : null;
  return {
    ...(contacts?.name ? { locationName: contacts.name } : {}),
    ...(contacts?.address ? { locationAddress: contacts.address } : {}),
    ...(serviceName ? { serviceName } : {}),
    ...(payload.start ? { start: payload.start } : {}),
  };
}
