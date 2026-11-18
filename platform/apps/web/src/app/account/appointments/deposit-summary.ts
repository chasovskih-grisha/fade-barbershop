// Рядок депозиту в картці візиту (T-4737): сума і дедлайн скасування —
// снепшот політики на візиті (PAY-ADM-09), не глобальні «4 години» в UI.
import type { ExtendedAppointment } from '@/lib/api/appointments';

const KYIV = 'Europe/Kyiv';

const dateFmt = new Intl.DateTimeFormat('uk-UA', {
  day: 'numeric',
  month: 'long',
  timeZone: KYIV,
});

const timeFmt = new Intl.DateTimeFormat('uk-UA', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: KYIV,
});

/** ISO-момент → «1 жовтня о 12:00» у зоні барбершопу; null — дати немає. */
export function formatCancelDeadline(iso: string | null): string | null {
  if (!iso) return null;
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
  return `${dateFmt.format(at)} о ${timeFmt.format(at)}`;
}

/**
 * Підпис під сумою депозиту. Дедлайн минув — картка каже це прямо, щоб не
 * показувати «скасуйте безкоштовно до» дати, яка вже позаду.
 */
export function depositDeadlineNote(
  visit: Pick<ExtendedAppointment, 'deposit'>,
  now: Date
): string | null {
  const deposit = visit.deposit;
  if (!deposit || deposit.amount <= 0) return null;
  const label = formatCancelDeadline(deposit.freeCancelUntil);
  const deadline = deposit.freeCancelUntil ? Date.parse(deposit.freeCancelUntil) : NaN;
  if (!label || Number.isNaN(deadline)) return null;
  return now.getTime() <= deadline
    ? `Безкоштовне скасування до ${label}`
    : 'Вікно безкоштовного скасування минуло — депозит утримається';
}
