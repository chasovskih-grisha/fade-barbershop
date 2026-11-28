// Рядок депозиту в картці візиту (T-4737): сума і дедлайн скасування —
// снепшот політики на візиті (PAY-ADM-09), не глобальні «4 години» в UI.
import { formatMoney } from '@fade/ui';
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

export type DepositHoldView = 'none' | 'active' | 'released' | 'paid';

/**
 * Стан утримання крісла з серверного снепшота. `active` без `holdStatus` —
 * старий API: суму показуємо, але нову дію оплати не вигадуємо.
 */
export function depositHoldView(
  visit: Pick<ExtendedAppointment, 'deposit'>,
  now: Date
): DepositHoldView {
  const deposit = visit.deposit;
  if (!deposit || deposit.amount <= 0) return 'none';
  if (deposit.holdStatus === 'captured') return 'paid';
  if (deposit.holdStatus === 'expired' || deposit.holdStatus === 'cancelled') return 'released';
  if (deposit.holdStatus === 'active' && deposit.expiresAt) {
    const deadline = Date.parse(deposit.expiresAt);
    if (!Number.isNaN(deadline) && now.getTime() > deadline) return 'released';
  }
  return 'active';
}

/**
 * Серверний дедлайн утримання; null — старий візит без утримання.
 * Перевикористовує `formatCancelDeadline`, щоб дати збігалися з вікном
 * скасування й не було двох різних форматів на одному екрані.
 */
export function depositHoldDeadline(visit: Pick<ExtendedAppointment, 'deposit'>): string | null {
  return formatCancelDeadline(visit.deposit?.expiresAt ?? null);
}

/** Куди вести клієнта, щоб доплатити незавершений депозит. */
export function depositResumeHref(
  visit: Pick<ExtendedAppointment, 'deposit'>,
  now: Date
): string | null {
  if (depositHoldView(visit, now) !== 'active') return null;
  const bookingId = visit.deposit?.bookingId;
  return bookingId ? `/booking/deposit/${encodeURIComponent(bookingId)}` : null;
}

/**
 * Рядок про повернення депозиту (T-094): клієнт бачить, куди поділися гроші,
 * а не лише те, що візит скасовано. null — повернення не було.
 */
export function refundNote(visit: Pick<ExtendedAppointment, 'deposit'>): string | null {
  const refund = visit.deposit?.refund;
  if (!refund) return null;
  const amount = formatMoney(refund.amount);
  if (refund.status === 'completed') return `Депозит ${amount} повернено`;
  if (refund.status === 'failed') {
    return `Повернення ${amount} не пройшло — зв'яжіться із салоном`;
  }
  return `Повернення депозиту ${amount} у дорозі`;
}

/**
 * Рядок під сумою депозиту в картці візиту (T-4737): серверний дедлайн
 * утримання або політика безкоштовного скасування — залежно від того, що
 * візит несе з собою. Депозит без жодного дедлайну — лише сума.
 */
export function depositHoldNote(
  visit: Pick<ExtendedAppointment, 'deposit'>,
  now: Date
): string | null {
  const state = depositHoldView(visit, now);
  if (state === 'released') return 'Час на оплату минув — крісло звільнено';
  if (state !== 'active') return null;

  // Серверний дедлайн утримання: є bookingId — можна доплатити.
  if (visit.deposit?.holdStatus && visit.deposit?.bookingId) {
    const deadline = depositHoldDeadline(visit);
    return deadline
      ? `Оплатіть депозит до ${deadline} — інакше крісло звільниться`
      : 'Очікує оплати депозиту';
  }

  // Політика безкоштовного скасування (снепшот з моменту запису, PAY-ADM-09).
  const cancelLabel = formatCancelDeadline(visit.deposit?.freeCancelUntil ?? null);
  if (!cancelLabel) return null;
  const deadline = Date.parse(visit.deposit!.freeCancelUntil!);
  if (Number.isNaN(deadline)) return null;
  return now.getTime() <= deadline
    ? `Безкоштовне скасування до ${cancelLabel}`
    : 'Вікно безкоштовного скасування минуло';
}
