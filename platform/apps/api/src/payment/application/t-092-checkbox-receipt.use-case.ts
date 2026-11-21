/* eslint-disable max-params -- 1 signature whose 4-param contract is fixed by existing call sites (worst: an existing definition, limit 3); API redesign tracked in T-2500f */
// T-092: ланцюг чеків Checkbox — депозит (#1) і закриваюча решта (#2) або
// повний продаж, коли депозиту не було. Ідемпотентність — через `check_id`,
// який генерує інтеграція (PAY-WEB-03, PAY-006). `FinalPrice = 0` до Checkbox
// не доходить узагалі (PAY-003/LYL-007): нульовий чек повертається як `exempt`
// без виклику провайдера.
import type { Booking } from '../../scheduling/domain/booking';
import { CheckboxReceiptType, type CheckboxReceipt } from './checkbox-fiscal-gateway';

/** Мінімум, потрібний від фіскального шлюзу. */
export interface ReceiptIssuer {
  issueReceipt(
    bookingId: string,
    amount: number,
    type: CheckboxReceiptType,
    checkId?: string
  ): Promise<CheckboxReceipt>;
}

export interface ReceiptLookup extends ReceiptIssuer {
  findReceipt(checkId: string): CheckboxReceipt | null;
}

const EXEMPT_AMOUNT = 0;

function exempt(type: CheckboxReceiptType, checkId: string, at: Date): CheckboxReceipt {
  return {
    check_id: checkId,
    type,
    amount: EXEMPT_AMOUNT,
    status: 'exempt',
    created_at: at,
  };
}

export class T092CheckboxReceipt {
  constructor(
    private readonly gateway: ReceiptLookup,
    private readonly now: () => Date = () => new Date()
  ) {}

  /** Чек #1: депозит списано (PaymentCaptured). */
  async issueDepositReceipt(booking: Booking): Promise<CheckboxReceipt> {
    const amount = booking.deposit?.amount ?? 0;
    return this.issue(booking, amount, CheckboxReceiptType.Deposit, `deposit_${booking.id}`);
  }

  /** Чек #2: закриваючий чек ланцюга — решта після депозиту. */
  async issueRemainderReceipt(booking: Booking): Promise<CheckboxReceipt> {
    const amount = this.remainderOf(booking);
    return this.issue(booking, amount, CheckboxReceiptType.Remainder, `remainder_${booking.id}`);
  }

  /** Повний продаж: візит без депозиту оплачено на місці. */
  async issueFullPaymentReceipt(booking: Booking): Promise<CheckboxReceipt> {
    const amount = booking.finalPrice ?? 0;
    return this.issue(booking, amount, CheckboxReceiptType.FullPayment, `full_${booking.id}`);
  }

  /** Статус чека для адмінки й кабінету (CHECKBOX: CREATED → DONE/ERROR). */
  getReceiptStatus(checkId: string): CheckboxReceipt | null {
    return this.gateway.findReceipt(checkId);
  }

  /**
   * `sum_equals_total_sum`: чек решти не може дорівнювати сумі всього ланцюга,
   * а повний чек мусить дорівнювати FinalPrice. Депозит — строго менше.
   */
  validateAmount(finalPrice: number, depositAmount: number, receiptAmount: number): boolean {
    if (receiptAmount <= 0) return false;
    const remainder = Math.max(0, finalPrice - depositAmount);
    return receiptAmount === remainder || receiptAmount === finalPrice;
  }

  private remainderOf(booking: Booking): number {
    const finalPrice = booking.finalPrice ?? 0;
    const depositAmount = booking.deposit?.amount ?? 0;
    return Math.max(0, finalPrice - depositAmount);
  }

  private async issue(
    booking: Booking,
    amount: number,
    type: CheckboxReceiptType,
    checkId: string
  ): Promise<CheckboxReceipt> {
    // PAY-003/LYL-007: безоплатний візит не є розрахунковою операцією.
    if (!booking.requiresPayment || amount <= 0) {
      return exempt(type, checkId, this.now());
    }
    return this.gateway.issueReceipt(booking.id, amount, type, checkId);
  }
}
