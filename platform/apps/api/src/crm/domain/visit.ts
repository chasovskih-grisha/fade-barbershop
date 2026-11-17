// Visit — read-model візиту (crm, T-061): проєкція подій scheduling у факт
// історії клієнта, який читають картки клієнта й барбера. Домен не знає
// Prisma/Nest/HTTP — на вході подія outbox, на виході факт. Статуси візиту —
// власна копія множини (крос-контекстний імпорт домену scheduling заборонений,
// ADR 0002); правило переходів тут не дублюємо — лише читаємо те, що записав
// агрегат. Ідемпотентність тримає застосунковий обробник (ключ — appointmentId).
//
// Час слота в подіях scheduling — рядок `HH:mm` (appointment.data), тож факт
// зберігає його як є; ось «коли» події — `occurredAt`. Дата візиту живе на
// Booking (scheduling) і до цієї проєкції не входить.

export type VisitStatus =
  'booked' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

/** Факт історії візиту; ключ — appointmentId (повторна доставка не дублює). */
export interface Visit {
  appointmentId: string;
  clientId: string;
  barberId: string | null;
  locationId: string | null;
  status: VisitStatus;
  /** Час початку слота `HH:mm` (як у події scheduling). */
  start: string | null;
  /** Час кінця слота `HH:mm` (як у події scheduling). */
  end: string | null;
  /** Час останньої прикладеної події — захист від регресу при redelivery. */
  occurredAt: Date;
}

/** Подія журналу візиту (outbox): тип, час, пейлоад. */
export interface VisitEvent {
  type: string;
  occurredAt: Date;
  payload?: Record<string, unknown>;
}

/** Який статус несе подія; події без зміни статусу (референс) — поза мапою. */
const RESULTING_STATUS: Record<string, VisitStatus> = {
  'scheduling.appointment.booked': 'booked',
  'scheduling.appointment.confirmed': 'confirmed',
  'scheduling.appointment.started': 'in_progress',
  'scheduling.appointment.completed': 'completed',
  'scheduling.appointment.cancelled': 'cancelled',
  'scheduling.appointment.no_showed': 'no_show',
};

const RESCHEDULED = 'scheduling.appointment.rescheduled';

/** Типи, які проєкція взагалі читає (решта подій контексту їй байдужі). */
export function isVisitEvent(type: string): boolean {
  return type in RESULTING_STATUS || type === RESCHEDULED;
}

function text(payload: Record<string, unknown> | undefined, key: string): string | null {
  const value = payload?.[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** Поле з події, інакше — з поточного факту, інакше — дефолт. */
function pick<T>(next: T | null, prev: T | null | undefined, fallback: T): T {
  return next ?? prev ?? fallback;
}

/**
 * Прикласти подію до поточного факту візиту (або до `null`, якщо візит ще
 * невідомий). Повертає новий факт, або `null` — подія не стосується візиту чи
 * старіша за вже застосовану (redelivery після новішої події не регресує стан).
 */
export function applyVisitEvent(
  current: Visit | null,
  event: VisitEvent,
  clientId: string
): Visit | null {
  if (!isVisitEvent(event.type)) return null;
  if (current && event.occurredAt.getTime() < current.occurredAt.getTime()) return current;

  const payload = event.payload;
  const status = RESULTING_STATUS[event.type] ?? current?.status ?? 'booked';
  return {
    appointmentId: pick(text(payload, 'appointmentId'), current?.appointmentId, ''),
    clientId,
    barberId: pick(text(payload, 'barberId'), current?.barberId, null),
    locationId: pick(text(payload, 'locationId'), current?.locationId, null),
    status,
    start: pick(text(payload, 'start'), current?.start, null),
    end: pick(text(payload, 'end'), current?.end, null),
    occurredAt: event.occurredAt,
  };
}
