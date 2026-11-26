// Порти й результати settlement скасованого візиту (T-4616a/ADR 0056 §7).
// Винесено з use case за LOC-гейтом: сам клас — лише порядок кроків.

export const BARBER_UNAVAILABLE_REASON = 'BARBER_UNAVAILABLE';

export interface RefundedBooking {
  refundId?: string | null;
  refundStatus?: string | null;
  capturedRefundAmount?: number | null;
}

export interface CancelSettlementBookings {
  findById(id: string): Promise<RefundedBooking | null>;
}

export interface CancelSettlementPayments {
  findByAppointmentId(appointmentId: string): Promise<Array<{ amount: number; status: string }>>;
}

export interface CancelSettlementHolds {
  release(appointmentId: string): Promise<boolean>;
}

export interface CancelSettlementRefunds {
  initiateRefund(
    bookingId: string,
    amount?: number,
    reasonCode?: string,
    refundId?: string
  ): Promise<{
    refund: { refundId: string; status: string; amount: number; adminNote?: string };
    isDuplicate: boolean;
  }>;
}

export type BarberCancelSettlementOutcome =
  | 'released_without_money'
  | 'refund_initiated'
  | 'refund_replayed'
  | 'refund_failed';

export interface BarberCancelSettlementResult {
  outcome: BarberCancelSettlementOutcome;
  holdReleased: boolean;
  amount?: number;
  refundId?: string;
  refundStatus?: string;
  failureReason?: string;
}
