// Маршрутизація події outbox → споживачі контексту notifications (T-080, T-4462).
// Один тип може мати кілька споживачів (booked → підтвердження + планування
// нагадування); рядок закривається publishedAt лише коли ВСІ вони довели
// справу (handled або duplicate). Типи без споживача не потрапляють у
// вибірку — POLL_TYPES єдине джерело правди для where.type.
import { REMINDER_DUE_EVENT_TYPE } from '../application/appointment-reminder-ports';
import { BOOKED_EVENT_TYPE } from '../application/booking-confirmation-ports';
import type { HandleOutcome, NotificationEvent } from '../application/send-booking-confirmation';

const SESSION_STARTED_EVENT_TYPE = 'identity.session.started';
const RESCHEDULED_EVENT_TYPE = 'scheduling.appointment.rescheduled';
const CANCELLED_EVENT_TYPE = 'scheduling.appointment.cancelled';
const LOYALTY_INCREMENTED_TYPE = 'loyalty.counter.incremented';
const LOYALTY_GRANTED_TYPE = 'loyalty.free_visit.granted';

/** Споживач у контексті notifications: один контракт handleOne. */
export interface RoutedConsumer {
  handleOne(event: NotificationEvent): Promise<HandleOutcome>;
}

/** Реєстр споживачів релея (складається модулем). */
export interface OutboxConsumers {
  confirmations: RoutedConsumer;
  alerts: RoutedConsumer;
  schedule: RoutedConsumer;
  reminders: RoutedConsumer;
  loyalty: RoutedConsumer;
  /** Push-канал візиту (T-080): booked/rescheduled/cancelled → пристрої. */
  appointmentPush: RoutedConsumer;
}

/** Типи, які релей забирає: об'єднання всіх маршрутів. */
export const POLL_TYPES: readonly string[] = [
  BOOKED_EVENT_TYPE,
  RESCHEDULED_EVENT_TYPE,
  CANCELLED_EVENT_TYPE,
  SESSION_STARTED_EVENT_TYPE,
  REMINDER_DUE_EVENT_TYPE,
  LOYALTY_INCREMENTED_TYPE,
  LOYALTY_GRANTED_TYPE,
];

/** Споживачі для типу події; порожній масив — тип нам не цікавий. */
export function consumersFor(type: string, deps: OutboxConsumers): RoutedConsumer[] {
  if (type === BOOKED_EVENT_TYPE) return [deps.confirmations, deps.schedule, deps.appointmentPush];
  if (type === RESCHEDULED_EVENT_TYPE) return [deps.schedule, deps.appointmentPush];
  if (type === CANCELLED_EVENT_TYPE) return [deps.appointmentPush];
  if (type === SESSION_STARTED_EVENT_TYPE) return [deps.alerts];
  if (type === REMINDER_DUE_EVENT_TYPE) return [deps.reminders];
  if (type === LOYALTY_INCREMENTED_TYPE || type === LOYALTY_GRANTED_TYPE) return [deps.loyalty];
  return [];
}
