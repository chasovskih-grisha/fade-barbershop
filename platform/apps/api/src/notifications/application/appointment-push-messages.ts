// Тексти push візиту українською (T-080) — функції, не листи: SMS/push не
// проходять Liquid-рендерер. Час — Europe/Kyiv (formatWhen, ADR 0001).
import { formatWhen } from './letter-fields';
import type { PushEventType } from './appointment-push-ports';

const CANCELLED = 'scheduling.appointment.cancelled';
const RESCHEDULED = 'scheduling.appointment.rescheduled';

export interface PushPayload {
  /** booked несе start, rescheduled — newStart (див. schedule-appointment-reminder). */
  start?: string;
  newStart?: string;
  /** Причина скасування; рішення по конфлікту (T-4616a) пише `barber unavailable`. */
  reason?: string;
  /** Барбер нового слота (перенесення на іншого майстра, T-4616a). */
  barberId?: string;
  /** Розв'язане ім'я барбера — не з події, а з лукапа споживача. */
  barberName?: string;
}

/** Барбер недоступний — це причина дії, а не діагноз: текст не називає хворобу (T-4616b). */
const BARBER_UNAVAILABLE = /barber unavailable|недоступний/i;

export function pushTitle(type: PushEventType): string {
  if (type === CANCELLED) return 'FADE: візит скасовано';
  if (type === RESCHEDULED) return 'FADE: візит перенесено';
  return 'FADE: візит записано';
}

export function pushBody(type: PushEventType, payload: PushPayload): string {
  if (type === CANCELLED) {
    if (BARBER_UNAVAILABLE.test(payload.reason ?? ''))
      return 'Барбер недоступний — візит скасовано. Оберіть новий час у кабінеті «Мої візити».';
    return 'Ваш візит скасовано. Якщо це помилка — зателефонуйте нам.';
  }
  const when = formatWhen(payload.newStart ?? payload.start);
  const barber = payload.barberName?.trim();
  if (type === RESCHEDULED && barber) {
    if (when) return `Ваш візит перенесено на ${when}, майстер ${barber}.`;
    return `Ваш візит перенесено, майстер ${barber}.`;
  }
  const action = type === RESCHEDULED ? 'перенесено' : 'записано';
  return when ? `Ваш візит ${action} на ${when}.` : `Ваш візит ${action}.`;
}
