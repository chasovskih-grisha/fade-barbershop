// Депозит у контракті кабінету: сума зі снепшота візиту + дедлайн, похідний
// від поточного початку. Неповний снепшот або нульова сума — про гроші мовчимо.
import { freeCancelDeadline } from '../domain/deposit-terms';

export interface ClientDepositView {
  amount: number;
  freeCancelUntil: string;
}

export function toClientDeposit(row: {
  depositAmount: number | null;
  cancellationWindowHours: number | null;
  start: Date;
}): ClientDepositView | null {
  if (row.depositAmount === null || row.depositAmount <= 0) return null;
  if (row.cancellationWindowHours === null) return null;
  const deadline = freeCancelDeadline(row.start, row.cancellationWindowHours);
  return { amount: row.depositAmount, freeCancelUntil: deadline.toISOString() };
}
