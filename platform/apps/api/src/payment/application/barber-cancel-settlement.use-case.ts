// T-4616a/ADR 0056 §7: «барбер недоступний» не є окремою підставою повернення —
// гроші йдуть звичайним шляхом політики депозиту. Але візит скасовано, тож
// утримання крісла мусить зникнути негайно, а списаний депозит — поїхати назад
// (T-094). Цей клас — міст між рішенням по конфлікту і платіжним журналом.
// Ідемпотентність: ключ `barber_unavailable_<appointmentId>`; T094Refund
// повертає наявний refund, якщо він уже створений.
import { isCapturedPaymentStatus } from '../../billing/domain/payment-status.enum';
import {
  BARBER_UNAVAILABLE_REASON,
  type BarberCancelSettlementResult,
  type CancelSettlementBookings,
  type CancelSettlementHolds,
  type CancelSettlementPayments,
  type CancelSettlementRefunds,
  type RefundedBooking,
} from './barber-cancel-settlement.ports';

export * from './barber-cancel-settlement.ports';

export class BarberCancelSettlement {
  constructor(
    private readonly deps: {
      bookings: CancelSettlementBookings;
      payments: CancelSettlementPayments;
      refunds: CancelSettlementRefunds;
      holds?: CancelSettlementHolds;
    }
  ) {}

  async settle(input: { appointmentId: string }): Promise<BarberCancelSettlementResult> {
    const { appointmentId } = input;
    const holdReleased = (await this.deps.holds?.release(appointmentId)) ?? false;

    // Візит уже має повернення (повторне рішення або скасування клієнтом):
    // гроші вже в дорозі — другий refund не створюємо.
    const booking = await this.deps.bookings.findById(appointmentId);
    if (booking?.refundId) return replayed(booking, holdReleased);

    const payments = await this.deps.payments.findByAppointmentId(appointmentId);
    const captured = payments.filter((payment) => isCapturedPaymentStatus(payment.status));
    if (captured.length === 0) return { outcome: 'released_without_money', holdReleased };

    return this.refund(appointmentId, captured, holdReleased);
  }

  private async refund(
    appointmentId: string,
    captured: Array<{ amount: number }>,
    holdReleased: boolean
  ): Promise<BarberCancelSettlementResult> {
    const amount = captured.reduce((sum, payment) => sum + payment.amount, 0);
    try {
      const { refund, isDuplicate } = await this.deps.refunds.initiateRefund(
        appointmentId,
        amount,
        BARBER_UNAVAILABLE_REASON,
        `barber_unavailable_${appointmentId}`
      );
      if (refund.status === 'failed') {
        return {
          outcome: 'refund_failed',
          holdReleased,
          amount: refund.amount,
          refundId: refund.refundId,
          refundStatus: refund.status,
          failureReason: refund.adminNote ?? 'acquiring_or_receipt_failed',
        };
      }
      return {
        outcome: isDuplicate ? 'refund_replayed' : 'refund_initiated',
        holdReleased,
        amount: refund.amount,
        refundId: refund.refundId,
        refundStatus: refund.status,
      };
    } catch (error) {
      // Повернення не вдалося — рішення по конфлікту вже закрите, візит
      // скасований, а refund лишається видимим для retry T-094.
      return {
        outcome: 'refund_failed',
        holdReleased,
        amount,
        failureReason: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

/** Візит уже має повернення — повторюємо наявний refund, без нового списання. */
function replayed(
  booking: RefundedBooking,
  holdReleased: boolean
): BarberCancelSettlementResult {
  return {
    outcome: 'refund_replayed',
    holdReleased,
    ...(booking.capturedRefundAmount != null ? { amount: booking.capturedRefundAmount } : {}),
    refundId: booking.refundId ?? '',
    ...(booking.refundStatus ? { refundStatus: booking.refundStatus } : {}),
  };
}
