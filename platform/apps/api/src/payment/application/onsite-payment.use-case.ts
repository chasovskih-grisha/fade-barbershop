/* eslint-disable max-lines, complexity, max-statements, max-params -- cohesive module (160 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 function with inherent domain branching (worst: an existing definition, complexity 18 vs 10); refactor tracked in T-2500f | 1 method with a single orchestration flow (worst: an existing definition, 32 statements vs 30); extraction tracked in T-2500f | 1 signature whose 5-param contract is fixed by existing call sites (worst: an existing definition, limit 3); API redesign tracked in T-2500f */
// T-093: оплата на місці (PAY-ONS-01…05). Сума не редагується: решта =
// FinalPrice − сплачений депозит; повторне позначення ідемпотентне; чек
// пробивається один раз — або закриваючий чек ланцюга, або повний продаж.
import { uuidv7 } from '@fade/domain-shared';
import type { Booking } from '../../scheduling/domain/booking';
import { Payment } from '../../billing/domain/payment.entity';
import {
  PaymentForm,
  PaymentStatus,
  isCapturedPaymentStatus,
} from '../../billing/domain/payment-status.enum';
import { CheckboxReceiptType, type CheckboxReceipt } from './checkbox-fiscal-gateway';
import type {
  AppointmentPaymentRepository,
  BookingPaymentPort,
  DepositCaptureGateway,
  DepositReceiptGateway,
  PaymentEventPublisher,
} from './deposit-flow.use-case';

export interface OnsitePaymentDeps {
  payments: AppointmentPaymentRepository;
  bookings: BookingPaymentPort;
  gateway: DepositCaptureGateway;
  receipts?: DepositReceiptGateway;
  events?: PaymentEventPublisher;
  clock?: { now(): Date };
}

export interface OnsitePaymentInput {
  bookingId: string;
  /** Готівка або POS-термінал (PAY-ONS-03). */
  form: PaymentForm.CASH | PaymentForm.POS;
  /** Хто позначив оплату — журнал «хто/коли/форма». */
  by: string;
}

export type OnsiteOutcome =
  'captured' | 'already_paid' | 'complimentary' | 'nothing_due' | 'failed';

export interface OnsitePaymentResult {
  booking: Booking;
  outcome: OnsiteOutcome;
  payment?: Payment;
  paidAmount: number;
  depositAmount: number;
  receipt?: CheckboxReceipt;
  failureReason?: string;
  audit: { at: Date; by: string; form: PaymentForm; amount: number };
}

export class OnsitePayment {
  constructor(private readonly deps: OnsitePaymentDeps) {}

  async execute(input: OnsitePaymentInput): Promise<OnsitePaymentResult> {
    const booking = await this.deps.bookings.findById(input.bookingId);
    if (!booking) throw new Error(`Booking ${input.bookingId} not found`);

    const now = this.deps.clock?.now() ?? new Date();
    const price = booking.finalPrice ?? 0;
    const depositAmount = booking.depositStatus === 'captured' ? (booking.deposit?.amount ?? 0) : 0;
    const paidAmount = Math.max(0, price - depositAmount);
    const audit = { at: now, by: input.by, form: input.form, amount: paidAmount };

    if (!booking.requiresPayment || price <= 0) {
      return {
        booking,
        outcome: 'complimentary',
        paidAmount: 0,
        depositAmount: 0,
        audit: { ...audit, amount: 0 },
      };
    }

    const existing = await this.deps.payments.findByAppointmentId(booking.id);
    const alreadyPaid = existing.find(
      (payment) =>
        payment.amount === paidAmount && isCapturedPaymentStatus(payment.status)
    );
    if (alreadyPaid) {
      return {
        booking,
        outcome: 'already_paid',
        payment: alreadyPaid,
        paidAmount,
        depositAmount,
        audit,
      };
    }

    if (paidAmount <= 0) {
      return {
        booking,
        outcome: 'nothing_due',
        paidAmount: 0,
        depositAmount,
        audit: { ...audit, amount: 0 },
      };
    }

    const payment = new Payment({
      id: uuidv7(),
      appointmentId: booking.id,
      ...(booking.clientId ? { clientId: booking.clientId } : { clientId: '' }),
      amount: paidAmount,
      form: input.form,
      status: PaymentStatus.AWAITING_BALANCE,
      traceId: `onsite_${booking.id}_${now.getTime()}`,
      createdAt: now,
      updatedAt: now,
    });
    await this.deps.payments.save(payment);

    const receiptType =
      depositAmount > 0 ? CheckboxReceiptType.Remainder : CheckboxReceiptType.FullPayment;
    const checkId = depositAmount > 0 ? `remainder_${booking.id}` : `full_${booking.id}`;

    // Готівку не проводять через еквайринг: достатньо позначки й фіскального
    // чека. POS/картка — через шлюз.
    if (input.form !== PaymentForm.CASH) {
      let captured: boolean;
      try {
        captured = await this.deps.gateway.capture(payment.id, paidAmount);
      } catch (error) {
        return this.fail(
          booking,
          payment,
          audit,
          depositAmount,
          `acquiring error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      if (!captured) {
        return this.fail(booking, payment, audit, depositAmount, 'acquiring declined the payment');
      }
    }

    const receipt = await this.issueReceipt(booking.id, paidAmount, receiptType, checkId);

    payment.markPaid(receipt?.check_id ?? checkId);
    await this.deps.payments.save(payment);

    booking.paymentMethod = input.form;
    await this.deps.bookings.save(booking);

    await this.deps.events?.publish({
      type: 'scheduling.appointment.onsite_payment_captured',
      data: {
        appointmentId: booking.id,
        paymentId: payment.id,
        amount: paidAmount,
        depositAmount,
        form: input.form,
        markedBy: input.by,
      },
    });

    return {
      booking,
      outcome: 'captured',
      payment,
      paidAmount,
      depositAmount,
      ...(receipt ? { receipt } : {}),
      audit,
    };
  }

  private async fail(
    booking: Booking,
    payment: Payment,
    audit: OnsitePaymentResult['audit'],
    depositAmount: number,
    reason: string
  ): Promise<OnsitePaymentResult> {
    payment.failCapture(reason);
    await this.deps.payments.save(payment);
    return {
      booking,
      outcome: 'failed',
      payment,
      paidAmount: 0,
      depositAmount,
      failureReason: reason,
      audit,
    };
  }

  /** Збій чека не скасовує вже отримані гроші; чек перевипускається за checkId. */
  private async issueReceipt(
    bookingId: string,
    amount: number,
    type: CheckboxReceiptType,
    checkId: string
  ): Promise<CheckboxReceipt | undefined> {
    if (!this.deps.receipts) return undefined;
    try {
      return await this.deps.receipts.issueReceipt(bookingId, amount, type, checkId);
    } catch {
      return undefined;
    }
  }
}
