// Порти push-каналу візиту (T-080): події життєвого циклу запису → push на
// пристрої клієнта. Клієнт резолвиться з appointmentId (Booking.clientId →
// User.id), токени — PushToken активних сесій; відписка — ClientNotificationPreference.
import type { NotificationJournal } from './booking-confirmation-ports';
import type { DevicePushTokens, PushSender } from './push-ports';

export const PUSH_EVENT_TYPES = [
  'scheduling.appointment.booked',
  'scheduling.appointment.rescheduled',
  'scheduling.appointment.cancelled',
] as const;

export type PushEventType = (typeof PUSH_EVENT_TYPES)[number];

/** Клієнт push: чи дозволив клієнт push-канал у кабінеті. */
export interface ClientPushPreferences {
  isPushEnabled(clientId: string): Promise<boolean>;
}

/** Клієнт запису за appointmentId (той самий контракт, що в SMS-каналу). */
export interface AppointmentClients {
  findClientIdByAppointmentId(appointmentId: string): Promise<string | null>;
}

export interface AppointmentPushDeps {
  push: PushSender;
  devices: DevicePushTokens;
  clients: AppointmentClients;
  preferences: ClientPushPreferences;
  journal: NotificationJournal;
}
