// Server-side Amplitude forwarding (T-4587): доменні події з outbox → події
// Amplitude. Мапа — таблиця, тож новий тип додається одним рядком; невідомі
// типи ігноруються (не ламають релей). insert_id детермінований, щоб клієнтська
// і серверна копії тієї ж події склеювались в Amplitude.

export interface DomainEventRecord {
  id: string;
  type: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export interface AmplitudeEvent {
  event_type: string;
  insert_id: string;
  time: number;
  user_id?: string;
  event_properties: Record<string, unknown>;
}

export const AMPLITUDE_EVENT_MAP: Readonly<Record<string, string>> = {
  'scheduling.appointment.booked': 'booking_confirmed',
  'scheduling.appointment.confirmed': 'appointment_confirmed_by_barber',
  'scheduling.appointment.started': 'appointment_started',
  'scheduling.appointment.completed': 'appointment_completed',
  'scheduling.appointment.no_showed': 'appointment_no_show',
  'scheduling.appointment.cancelled': 'appointment_cancelled',
  'scheduling.appointment.rescheduled': 'appointment_rescheduled',
  'billing.payment.captured': 'payment_captured',
  'billing.payment.refunded': 'payment_refunded',
  'billing.payment.failed': 'payment_failed',
  'billing.receipt.issued': 'receipt_issued',
  'loyalty.cashback.earned': 'loyalty_cashback_earned',
  'loyalty.counter.incremented': 'loyalty_visit_counted',
  'discounts.discount.applied': 'discount_applied',
  'gift-certificate.sold': 'gift_certificate_purchased',
  'gift-certificate.redeemed': 'gift_certificate_redeemed',
  'gift-certificate.expired': 'gift_certificate_expired',
  'crm.client.registered': 'client_registered',
};

export const FORWARDED_EVENT_TYPES: readonly string[] = Object.keys(AMPLITUDE_EVENT_MAP);

/** PII не покидає сервер: телефони/пошти/імена/адреси/коментарі вирізаються. */
const PII_KEY = /phone|email|name|address|comment|note/i;

export function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (PII_KEY.test(key)) continue;
    if (typeof value === 'string' && (value.includes('@') || /^\+?\d{10,}$/.test(value))) continue;
    result[key] = value;
  }
  return result;
}

export function amplitudeEventName(type: string): string | null {
  return AMPLITUDE_EVENT_MAP[type] ?? null;
}

/** `${event}_${aggregate}_${timestamp}` — той самий id для тих самих даних. */
export function insertId(name: string, record: DomainEventRecord): string {
  return `${name}_${record.aggregateId}_${record.occurredAt.getTime()}`;
}

export function toAmplitudeEvent(record: DomainEventRecord): AmplitudeEvent | null {
  const name = amplitudeEventName(record.type);
  if (!name) return null;
  const userId = typeof record.payload.clientId === 'string' ? record.payload.clientId : undefined;
  const event: AmplitudeEvent = {
    event_type: name,
    insert_id: insertId(name, record),
    time: record.occurredAt.getTime(),
    event_properties: sanitizePayload(record.payload),
  };
  return userId ? { ...event, user_id: userId } : event;
}

/** Ретраї вебхуків: 1 хв, 5 хв, 15 хв, 1 год, 6 год; далі — dead letter. */
export const AMPLITUDE_RETRY_MINUTES = [1, 5, 15, 60, 360];

export function retryAt(attempt: number, now: Date): Date | null {
  const minutes = AMPLITUDE_RETRY_MINUTES[attempt - 1];
  return minutes === undefined ? null : new Date(now.getTime() + minutes * 60_000);
}
