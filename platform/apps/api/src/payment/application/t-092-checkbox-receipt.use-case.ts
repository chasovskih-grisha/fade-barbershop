import { Booking, BookingRepository } from '../../scheduling/domain/booking';
import { BookingCreateParams } from '../../scheduling/domain/booking.data';
import { CheckboxFiscalGateway, CheckboxReceiptType } from './checkbox-fiscal-gateway';
import { BookAppointmentDeps } from '../../scheduling/application/book-appointment.types';
import type { BookAppointmentDeps } from '../../scheduling/application/book-appointment.types';
export type { BookAppointmentDeps };

/** T-092: Checkbox fiskalні чеки для депозиту та остачі.
 * Integraciya s Checkbox UA fiskalService.
 * чек #1 (deposit) — коли depositStatus → Captured
 * чек #2 (remainder) — коли booking → DONE
 * ідемпотентність через check_id; FinalPrice = 0 — експтут.
 */
export class T092CheckboxReceipt {
  constructor(
    private readonly gateway: CheckboxFiscalGateway,
    private readonly bookingRepo: BookingRepository
  ) {}

  /** Issue deposit receipt when deposit is captured.
   * Викликається з DepositFlow.execute після CapturePayment.
   */
  async issueDepositReceipt(booking: Booking): Promise<CheckboxReceipt> {
    const depositAmount = booking.depositAmount ?? 0;
    return this.gateway.issueReceipt(
      booking.id,
      depositAmount,
      CheckboxReceiptType.Deposit,
      `deposit_${booking.id}`
    );
  }

  /** Issue remainder receipt when booking is finalized.
   * callee: Remainder = FinalPrice - depositAmount
   * Викликається з book-appointment.use-case після переходу у DONE.
   */
  async issueRemainderReceipt(booking: Booking): Promise<CheckboxReceipt> {
    const finalPrice = booking.finalPrice ?? 0;
    const depositAmount = booking.depositAmount ?? 0;
    const remainderAmount = Math.max(0, finalPrice - depositAmount);

    return this.gateway.issueReceipt(
      booking.id,
      remainderAmount,
      CheckboxReceiptType.Remainder,
      `remainder_${booking.id}`
    );
  }

  /** Full payment receipt when no deposit, full amount paid at once.
   * Викликається при walk-in оплаті безDepositu.
   */
  async issueFullPaymentReceipt(booking: Booking): Promise<CheckboxReceipt> {
    const finalPrice = booking.finalPrice ?? 0;
    return this.gateway.issueReceipt(
      booking.id,
      finalPrice,
      CheckboxReceiptType.FullPayment,
      `full_${booking.id}`
    );
  }

  /** Get receipt status by check_id.
   * Для адмін-панелі та клієнтського статусу.
   */
  async getReceiptStatus(checkId: string): Promise<CheckboxReceipt | null> {
    // In production: query Checkbox API for receipt status
    // For now, return cached status or null
    const cached = this.checkIdCounter.get(checkId);
    if (cached) {
      return {
        check_id: checkId,
        type: cached.status === 'signed' ? CheckboxReceiptType.Deposit : CheckboxReceiptType.Deposit,
        amount: cached.amount,
        status: cached.status as any,
        created_at: cached.created_at,
      };
    }
    return null;
  }

  /** Validate that receipt amount matches booking total (sum_equals_total_sum check). */
  validateAmount(finalPrice: number, depositAmount: number, receiptAmount: number): boolean {
    // sum_equals_total_sum: receipt amount must equal finalPrice - depositAmount (or finalPrice for full payment)
    const expected = finalPrice - depositAmount;
    return receiptAmount === expected || receiptAmount === finalPrice;
  }
}