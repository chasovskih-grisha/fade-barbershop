// Наслідок скасування для депозиту (T-4737). Діалог називає лише те, що знає
// візит: немає депозиту або немає збереженого вікна — про гроші не говоримо.
import type { ExtendedAppointment } from '@/lib/api/appointments';

export type CancelDepositOutcome = 'returned' | 'retained';

/**
 * Вікно скасування береться зі снепшота на візиті (PAY-ADM-09), а не з
 * глобальних «4 годин»: скасування в момент дедлайну або раніше повертає
 * депозит, пізніше — утримує. Невідомий/зіпсований дедлайн — тихий випадок.
 */
export function cancelDepositOutcome(
  visit: Pick<ExtendedAppointment, 'deposit'>,
  now: Date
): CancelDepositOutcome | null {
  const deposit = visit.deposit;
  if (!deposit || deposit.amount <= 0 || !deposit.freeCancelUntil) return null;
  const deadline = Date.parse(deposit.freeCancelUntil);
  if (Number.isNaN(deadline)) return null;
  return now.getTime() <= deadline ? 'returned' : 'retained';
}
