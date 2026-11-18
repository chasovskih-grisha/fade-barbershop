// Історія статусів Appointment (T-4534): чиста проекція журналу подій outbox
// у зміни статусу — «було → стало», актор, причина, час. Правило переходів не
// дублюємо (appointment.transitions.ts), лише читаємо те, що вже записав
// агрегат. Домен не знає Nest/Prisma — на вході події, на виході read model.

import type { AppointmentStatus } from './appointment.transitions';

/** Подія журналу візиту (outbox): тип, час, пейлоад. */
export interface StatusHistoryEvent {
  type: string;
  occurredAt: Date;
  payload?: Record<string, unknown>;
}

/** Один рядок історії: статус-перехід з актором і причиною. */
export interface StatusChangeEntry {
  appointmentId: string;
  /** `null` — запис створено (попереднього статусу не було). */
  from: AppointmentStatus | null;
  to: AppointmentStatus;
  actorId: string | null;
  actorRole: string | null;
  reason: string | null;
  occurredAt: Date;
}

/** Який статус несе подія; події без зміни статусу (reschedule/референс) — поза мапою. */
const RESULTING_STATUS: Record<string, AppointmentStatus> = {
  'scheduling.appointment.booked': 'booked',
  'scheduling.appointment.confirmed': 'confirmed',
  'scheduling.appointment.started': 'in_progress',
  'scheduling.appointment.completed': 'completed',
  'scheduling.appointment.cancelled': 'cancelled',
  'scheduling.appointment.no_showed': 'no_show',
};

function text(payload: Record<string, unknown> | undefined, key: string): string | null {
  const value = payload?.[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** Історія статусів із подій у порядку надходження (найстаріші перші). */
export function buildStatusHistory(
  appointmentId: string,
  events: StatusHistoryEvent[]
): StatusChangeEntry[] {
  const history: StatusChangeEntry[] = [];
  let previous: AppointmentStatus | null = null;
  for (const event of events) {
    const to = RESULTING_STATUS[event.type];
    if (!to) continue;
    history.push({
      appointmentId,
      from: previous,
      to,
      actorId: text(event.payload, 'actorId'),
      actorRole: text(event.payload, 'actorRole'),
      reason: text(event.payload, 'reason'),
      occurredAt: event.occurredAt,
    });
    previous = to;
  }
  return history;
}

/** Найновіші зміни першими — так історію читають в адмінці й кабінеті. */
export function orderHistory(history: StatusChangeEntry[]): StatusChangeEntry[] {
  return [...history].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
}

/** Сторінка історії: зріз від `offset` + повна кількість рядків. */
export function paginateHistory(
  history: StatusChangeEntry[],
  page: { limit: number; offset: number }
): { items: StatusChangeEntry[]; total: number } {
  const offset = Math.max(0, page.offset);
  return { items: history.slice(offset, offset + Math.max(0, page.limit)), total: history.length };
}
