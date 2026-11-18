import { Booking, BookingConflictError, PaymentStatus } from '../../scheduling/domain/booking';
import { BookingRepository } from '../../scheduling/domain/booking-repository';
import { PriceSnapshot } from '../../scheduling/application/book-appointment.pricing';
import { DepositPolicy } from '../../scheduling/domain/deposit-terms';
import { depositPolicy as defaultDepositPolicy } from '../../scheduling/application/deposit-policy';
import { priceSnapshot } from '../../scheduling/application/book-appointment.pricing';
import { compositionDuration } from '../../scheduling/domain/composed-slot-span';
import { withSpan, TRACING } from '../../shared/tracing/tracing';
import type { BookAppointmentDeps } from '../../scheduling/application/book-appointment.types';
import { Payment } from '../../billing/domain/payment.entity';
import { PaymentStatus as BillingPaymentStatus } from '../../billing/domain/payment-status.enum';
import { FiscalGateway, FiscalReceiptDetails } from '../../billing/domain/fiscal.gateway.interface';
import { CheckboxFiscalGateway, CheckboxReceiptType } from './checkbox-fiscal-gateway';


export type { BookAppointmentDeps };

/** Waitlist deposit flow use-case: 30% deposit on waitlist slot acceptance, idempotent, rounding 10 UAH.
 * T-197: Deposit/payment functionality for waitlist bookings.
 * Extends T-091 deposit flow to waitlist context.
 * When a waitlist slot is accepted, client must pay 30% deposit to secure the slot.
 * Deposit is applied toward final balance at visit.
 */

export interface WaitlistDepositInput {
  waitlistId: string;
  clientId: string;
  slotId: string;
  finalPrice: number;
  occurredAt?: Date;
}

export interface WaitlistDepositResult {
  payment: PaymentProps;
  booking?: Booking;
  depositAmount: number;
  requiresBalance: boolean;
  depositReceipt?: CheckboxReceipt;
}

/** Payment props compatible with both booking and billing domains. */
export interface PaymentProps {
  id: string;
  appointmentId?: string;
  orderId?: string;
  clientId: string;
  amount: number;
  form: PaymentForm;
  status: PaymentStatus;
  traceId: string;
  receiptId?: string;
  refundReason?: string;
  refundedAmount?: number;
  retryCount?: number;
  createdAt: Date;
  updatedAt: Date;
  waitlistId?: string;
  slotId?: string;
}

/** Payment form enum - compatible with billing domain. */
export enum PaymentForm {
  CARD = 'card',
  CASH = 'cash',
  POS = 'pos',
  CERTIFICATE = 'certificate',
}

/** Waitlist Deposit Flow use-case. */
export class WaitlistDepositFlow {
  constructor(
    private readonly deps: {
      bookingRepo: BookingRepository;
      paymentRepo: { create: (p: PaymentProps) => Payment; update: (id: string, s: Partial<PaymentProps>) => Payment };
      depositPolicy?: () => Promise<DepositPolicy>;
      checkboxGateway?: CheckboxFiscalGateway;
      eventBus?: { publish: (e: { type: string; data: any }) => Promise<void> };
    }
  ) {}

  async execute(input: WaitlistDepositInput): Promise<WaitlistDepositResult> {
    return withSpan({
      name: TRACING.WAITLIST_DEPOSIT_FLOW,
      options: {
        attributes: {
          'fade.waitlist.waitlist_id': input.waitlistId,
          'fade.waitlist.final_price': input.finalPrice,
        },
      },
      work: async () => {
        // Check if deposit already paid (idempotency)
        const existingPayment = await this.deps.paymentRepo.findByWaitlistId(input.waitlistId);
        if (existingPayment && existingPayment.status === BillingPaymentStatus.Captured) {
          return {
            payment: existingPayment,
            depositAmount: existingPayment.amount,
            requiresBalance: false,
            depositReceipt: existingPayment.receiptId ? await this.deps.checkboxGateway?.issueReceipt(
              input.waitlistId,
              existingPayment.amount,
              CheckboxReceiptType.Deposit,
              existingPayment.receiptId
            ) : undefined,
          };
        }

        const depositPolicy = await this.deps.depositPolicy?.get() ?? defaultDepositPolicy;
        const depositAmount = this.calculateDepositAmount(input.finalPrice, depositPolicy);

        // Create payment record for waitlist deposit
        const traceId = `wl_${input.waitlistId}_${Date.now()}`;
        const payment = await this.deps.paymentRepo.create({
          id: `pay_wl_${input.waitlistId}`,
          clientId: input.clientId,
          amount: depositAmount,
          form: PaymentForm.CARD, // default; UI will override
          status: BillingPaymentStatus.AWAITING_DEPOSIT,
          traceId,
          waitlistId: input.waitlistId,
          slotId: input.slotId,
          createdAt: input.occurredAt ?? new Date(),
          updatedAt: new Date(),
        });

        // Attempt to capture payment via gateway
        try {
          const captured = await this.capturePayment(payment, depositAmount);
          if (captured) {
            // Mark deposit as paid and link to waitlist
            const updatedPayment = await this.deps.paymentRepo.update(payment.id, {
              status: BillingPaymentStatus.DEPOSIT_PAID,
              receiptId: payment.receiptId,
              updatedAt: new Date(),
            });

            // Issue fiscal receipt for deposit
            let depositReceipt: CheckboxReceipt | undefined;
            if (this.deps.checkboxGateway) {
              depositReceipt = await this.deps.checkboxGateway.issueReceipt(
                input.waitlistId,
                depositAmount,
                CheckboxReceiptType.Deposit,
                updatedPayment.receiptId
              );
            }

            // TODO: In T-197 full integration, would update waitlist slot status to 'confirmed'
            // and mark the waitlist entry as accepted with deposit paid.
            // For now, return payment result for UI to show deposit collected.

            return {
              payment: updatedPayment,
              depositAmount,
              requiresBalance: true, // balance due at visit
              depositReceipt,
            };
          }
        } catch (error) {
          // Mark payment as failed
          await this.deps.paymentRepo.update(payment.id, { status: BillingPaymentStatus.Failed });
          console.error('Waitlist deposit payment failed', {
            paymentId: payment.id,
            amount: depositAmount,
            error: error instanceof Error ? error.message : String(error),
          });
        }

        return {
          payment: await this.deps.paymentRepo.findById(payment.id),
          depositAmount: 0,
          requiresBalance: true,
          depositReceipt: undefined,
        };
      },
    });
  }

  private calculateDepositAmount(finalPrice: number | null, policy: DepositPolicy): number {
    if (finalPrice == null || finalPrice <= 0) return 0;
    const rawDeposit = Math.round((finalPrice * policy.depositPercent) / 100);
    // Rounding to 10 UAH (PAY-ADM-09)
    const roundedDeposit = Math.round(rawDeposit / 10) * 10;
    // Cap at FinalPrice (can't deposit more than total)
    return Math.min(roundedDeposit, finalPrice);
  }

  private async capturePayment(payment: Payment, amount: number): Promise<boolean> {
    // Idempotency check: if already captured, return true
    if (payment.status === BillingPaymentStatus.Captured) return true;

    // Attempt to capture payment via Checkbox fiscal gateway / Stripe
    const success = await this.simulatePaymentGateway(payment, amount);

    if (success) {
      // Mark as captured via Checkbox receipt issuance
      if (this.deps.checkboxGateway) {
        await this.deps.checkboxGateway.issueReceipt(
          payment.waitlistId || '',
          amount,
          CheckboxReceiptType.Deposit,
          payment.receiptId
        );
      }
      await this.deps.paymentRepo.update(payment.id, { status: BillingPaymentStatus.Captured });
      return true;
    }

    // Log error, don't block waitlist slot acceptance (allow retry)
    console.error('Waitlist deposit payment gateway failed', {
      paymentId: payment.id,
      amount,
    });
    return false;
  }

  private async simulatePaymentGateway(payment: Payment, amount: number): Promise<boolean> {
    // 90% success rate for simulation
    // Real implementation would call PAY provider API (Stripe, Checkbox, etc.)
    return Math.random() > 0.1;
  }
}

/** Waitlist Deposit Flow scaffold. */
export const waitlistDepositFlow = new WaitlistDepositFlow({
  bookingRepo: {} as BookingRepository,
  paymentRepo: {
    create: (p: PaymentProps) => {
      const payment = new Payment({
        id: p.id,
        appointmentId: p.appointmentId,
        orderId: p.orderId,
        clientId: p.clientId,
        amount: p.amount,
        form: p.form,
        status: p.status,
        traceId: p.traceId,
        receiptId: p.receiptId,
        refundReason: p.refundReason,
        refundedAmount: p.refundedAmount,
        retryCount: p.retryCount,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      });
      // @ts-ignore - Payment entity stores extra props
      ;(payment as any).props = { ...p };
      return payment;
    },
    update: async (id: string, s: Partial<PaymentProps>) => {
      // Simulate DB update - return updated payment
      return await new Promise<Payment>((resolve) => {
        setTimeout(() => {
          resolve(new Payment({
            id,
            ...s,
          }));
        }, 10);
      });
    },
  },
  depositPolicy: async () => defaultDepositPolicy,
  checkboxGateway: {} as CheckboxFiscalGateway,
  eventBus: {
    publish: async () => {},
  },
});