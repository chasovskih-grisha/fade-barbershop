// Депозит у контракті кабінету: сума зі снепшота візиту + дедлайн, похідний
// від поточного початку. Неповний снепшот або нульова сума — про гроші мовчимо.
import { freeCancelDeadline } from '../domain/deposit-terms';

export type ClientDepositHoldStatus = 'active' | 'captured' | 'expired' | 'cancelled';

/**
 * Повернення депозиту в кабінеті (T-094): клієнт бачить, що гроші їдуть назад,
 * а не лише зникаючий візит. Статуси — RefundStatus із billing.
 */
export interface ClientDepositRefundView {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** Сума повернення в грн; completed — фактично повернута. */
  amount: number;
}

export interface ClientDepositView {
  amount: number;
  freeCancelUntil: string;
  /** Booking id used by POST /payment/bookings/:bookingId/deposit (not appointment id). */
  bookingId?: string;
  /** Server-side chair hold deadline; absent for visits created before holds. */
  expiresAt?: string;
  holdStatus?: ClientDepositHoldStatus;
}

export function toClientDeposit(
  row: {
    id: string;
    depositAmount: number | null;
    cancellationWindowHours: number | null;
    start: Date;
  },
  hold?: { expiresAt: Date; status: string } | null,
  refund?: { status: string; amount: number | null } | null
): ClientDepositView | null {
  if (row.depositAmount === null || row.depositAmount <= 0) return null;
  if (row.cancellationWindowHours === null) return null;
  const deadline = freeCancelDeadline(row.start, row.cancellationWindowHours);
  const terms: ClientDepositView = {
    amount: row.depositAmount,
    freeCancelUntil: deadline.toISOString(),
    ...(refund ? { refund: toRefundView(row.depositAmount, refund) } : {}),
  };
  if (!hold) return terms;
  return {
    ...terms,
    bookingId: row.id,
    expiresAt: hold.expiresAt.toISOString(),
    holdStatus: hold.status as ClientDepositHoldStatus,
  };
}

function toRefundView(
  depositAmount: number,
  refund: { status: string; amount: number | null }
): ClientDepositRefundView {
  return {
    status: refund.status as ClientDepositRefundView['status'],
    amount: refund.amount ?? depositAmount,
  };
}
