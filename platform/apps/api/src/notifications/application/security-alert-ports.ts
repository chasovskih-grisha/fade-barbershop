// Порти сповіщень безпеки (T-4422): email клієнта, спільний журнал, депси.
// Журнал — той самий NotificationJournal, що й у підтверджень запису:
// eventId унікальний, at-least-once без дублів (патерн T-042c).

import type { IDENTITY_EVENTS } from '@fade/contracts';
import type { NotificationJournal } from './booking-confirmation-ports';
import type { DevicePushTokens, PushSender } from './push-ports';
import type { EmailSender } from '../../shared/email/ports';

/** Подійні типи, які обробляє NewDeviceAlert. */
export type SecurityEventType = (typeof IDENTITY_EVENTS)['SESSION_STARTED'];

export interface SecurityAlertEvent {
  id: string;
  type: SecurityEventType;
  aggregateId: string;
  /** sessionId — сесія, що щойно увійшла: на неї пуш не шлемо. */
  payload: { sessionId: string; userId: string; channel: string };
}

/** Email клієнта за userId (identity User); null — адреса не задана. */
export interface UserEmails {
  findEmailByUserId(userId: string): Promise<string | null>;
}

export interface SecurityAlertDeps {
  email: EmailSender;
  push: PushSender;
  users: UserEmails;
  devices: DevicePushTokens;
  journal: NotificationJournal;
}
