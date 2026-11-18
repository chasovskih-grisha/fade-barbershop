// Тексти push візиту українською (T-080) — функції, не листи: SMS/push не
// проходять Liquid-рендерер. Час — Europe/Kyiv (formatWhen, ADR 0001).
import { formatWhen } from './letter-fields';
import type { PushEventType } from './appointment-push-ports';

const CANCELLED = 'scheduling.appointment.cancelled';
const RESCHEDULED = 'scheduling.appointment.rescheduled';

export function pushTitle(type: PushEventType): string {
  if (type === CANCELLED) return 'FADE: візит скасовано';
  if (type === RESCHEDULED) return 'FADE: візит перенесено';
  return 'FADE: візит записано';
}

export function pushBody(type: PushEventType, payload: { start?: string }): string {
  if (type === CANCELLED) return 'Ваш візит скасовано. Якщо це помилка — зателефонуйте нам.';
  const when = formatWhen(payload.start);
  const action = type === RESCHEDULED ? 'перенесено' : 'записано';
  return when ? `Ваш візит ${action} на ${when}.` : `Ваш візит ${action}.`;
}
