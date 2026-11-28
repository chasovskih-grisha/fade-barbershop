// Мапери рядків Prisma у форми адмін-деталей (Booking, партія, подія
// outbox, сповіщення). Окремо від read-моделі — щоб handle() лишався простим.

import { eventActor, eventDetails, eventLabel } from './admin-booking-detail.events';
import type { BookingRow, NotificationRow, OutboxRow, PartyRow } from './admin-booking-detail.rows';
import type {
  BookingEventView,
  BookingNotificationView,
  BookingPartyView,
} from './admin-booking-detail.view';

/** T-4419: тривалість і варіант читаються зі снепшоту запису, не з різниці часу. */
const durationSnapshot = (row: BookingRow) => ({
  agreedDuration: row.agreedDuration,
  durationVariant: row.durationVariant,
});

// prettier-ignore
export const mapBookingRow = (row: BookingRow) => ({
  id: row.id,
  appointmentId: row.appointmentId,
  status: row.status ?? 'booked',
  cancelReason: row.cancelReason,
  start: row.start.toISOString(),
  end: row.end.toISOString(),
  durationMinutes: Math.round((row.end.getTime() - row.start.getTime()) / 60000),
  agreedPrice: row.agreedPrice,
  ...durationSnapshot(row),
  fulfillmentMode: row.fulfillmentMode,
  source: row.source ?? 'web',
  comment: row.appointmentComment,
  haircutReferenceId: row.haircutReferenceId,
  partyRole: row.partyRole,
  version: row.version,
});

// prettier-ignore
export const mapParty = (row: PartyRow): BookingPartyView => ({
  id: row.id,
  role: row.role,
  mode: row.mode,
  userId: row.userId,
  barberId: row.barberId,
  barberIds: row.barberIds,
  locationId: row.locationId,
  serviceId: row.serviceId,
  agreedPrice: row.agreedPrice,
  date: row.date?.toISOString() ?? null,
  legs: Array.isArray(row.partyLegs) ? (row.partyLegs as BookingPartyView['legs']) : [],
});

// Dispatcher (outbox-poll) закриває подію лише publishedAt — статус у рядку
// лишається дефолтним, тож ефективний стан рахуємо тут.
// prettier-ignore
export const mapEvent = (row: OutboxRow): BookingEventView => {
  const payload = (row.payload ?? {}) as Record<string, unknown>;
  return { id: row.id, type: row.type, label: eventLabel(row.type), occurredAt: row.createdAt.toISOString(), publishedAt: row.publishedAt?.toISOString() ?? null, status: row.publishedAt ? 'published' : row.status, actor: eventActor(payload), details: eventDetails(row.type, payload) };
};

// prettier-ignore
export const mapNotification = (row: NotificationRow): BookingNotificationView => ({
  id: row.id, type: row.type, channel: row.channel, recipient: row.recipient, subject: row.subject, status: row.status, detail: row.detail, sentAt: row.sentAt.toISOString(),
});
