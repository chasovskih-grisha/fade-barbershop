// Застосування розрахунку депозита до платежу (T-160).
//
// Політика — у domain/deposit-settlement.ts; тут лише переходи `Payment`
// і зовнішні ефекти: повернення через еквайринг та видатковий чек Checkbox
// (PAY-010). Для no-show жодних переходів і жодного реверсу — чек #1
// лишається чинним (PAY-010, NSH-003).
import { Payment } from '../../billing/domain/payment.entity';
import { PaymentStatus } from '../../billing/domain/payment-status.enum';
import type { DepositTerms } from '../domain/deposit-terms';
import {
  settleDeposit,
  type AppointmentOutcome,
  type DepositSettlement,
} from '../domain/deposit-settlement';

/** Порт збереження платежів депозиту (снепшот статусу). */
export interface SettlementPaymentRepository {
  load(paymentId: string): Promise<Payment | null>;
  save(payment: Payment): Promise<Payment>;
}

/** Порт еквайрингу: повернення захопленого депозиту. */
export interface DepositRefundGateway {
  refund(payment: Payment, amount: number): Promise<{ refundId: string }>;
}

/** Порт фіскального реверсування (PAY-010). */
export interface DepositRefundReceiptIssuer {
  issueRefundReceipt(
    payment: Payment,
    refundId: string,
    amount: number
  ): Promise<{ checkId: string } | null>;
}

export interface DepositSettlementDeps {
  payments: SettlementPaymentRepository;
  refunds?: DepositRefundGateway;
  fiscal?: DepositRefundReceiptIssuer;
  clock?: () => Date;
}

export interface DepositSettlementResult extends DepositSettlement {
  payment: Payment;
  /** Чи повернення виконано (для release-гілки). */
  refunded: boolean;
  refundReceiptId?: string;
}

/** Статуси, у яких депозит справді списаний (PAY-005). */
const CAPTURED: ReadonlySet<PaymentStatus> = new Set([
  PaymentStatus.DEPOSIT_PAID,
  PaymentStatus.AWAITING_BALANCE,
  PaymentStatus.PAID,
  PaymentStatus.PARTIALLY_REFUNDED,
]);

export class DepositSettlementService {
  constructor(private readonly deps: DepositSettlementDeps) {}

  async settle(input: {
    paymentId: string;
    terms: DepositTerms | null;
    outcome: AppointmentOutcome;
    appointmentStart: Date;
    occurredAt?: Date;
  }): Promise<DepositSettlementResult> {
    const payment = await this.deps.payments.load(input.paymentId);
    if (!payment) throw new Error(`Payment ${input.paymentId} not found`);

    const occurredAt = input.occurredAt ?? this.deps.clock?.() ?? new Date();
    const settlement = settleDeposit({
      terms: input.terms,
      outcome: input.outcome,
      appointmentStart: input.appointmentStart,
      occurredAt,
      captured: CAPTURED.has(payment.status),
    });

    if (settlement.action === 'none' || settlement.action === 'carry_over') {
      return { ...settlement, payment, refunded: false };
    }

    if (settlement.action === 'forfeit') {
      // Гроші лишаються в салоні; статус платежу не змінюється (NSH-003).
      return { ...settlement, payment, refunded: false };
    }

    if (settlement.reason === 'visit_completed') {
      const credited = await this.creditToBill(payment);
      return { ...settlement, payment: credited, refunded: false };
    }

    return this.refund(payment, settlement.refundAmount, settlement);
  }

  /** Депозит зараховано у рахунок візиту: лишається баланс до сплати. */
  private async creditToBill(payment: Payment): Promise<Payment> {
    if (payment.status !== PaymentStatus.DEPOSIT_PAID) return payment;
    payment.markAwaitingBalance();
    return this.deps.payments.save(payment);
  }

  private async refund(
    payment: Payment,
    amount: number,
    settlement: DepositSettlement
  ): Promise<DepositSettlementResult> {
    payment.initiateRefund('timely_cancellation');
    const refund = this.deps.refunds
      ? await this.deps.refunds.refund(payment, amount)
      : { refundId: `refund_${payment.id}` };
    payment.completeRefund(refund.refundId, amount);
    const saved = await this.deps.payments.save(payment);

    // PAY-010: видатковий чек; збій чека не відкочує повернення.
    const receipt = this.deps.fiscal
      ? await this.deps.fiscal.issueRefundReceipt(saved, refund.refundId, amount)
      : null;

    const result: DepositSettlementResult = {
      ...settlement,
      payment: saved,
      refunded: true,
    };
    if (receipt?.checkId) result.refundReceiptId = receipt.checkId;
    return result;
  }
}
