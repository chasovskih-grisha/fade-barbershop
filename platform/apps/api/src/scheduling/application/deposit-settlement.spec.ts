/* eslint-disable max-lines, max-params -- cohesive module (192 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 signature whose 4-param contract is fixed by existing call sites (worst: policy, limit 3); API redesign tracked in T-2500f */
// Специфікація T-160: утримання депозита при no-show і повернення при
// своєчасному скасуванні — від умов снепшота візиту (PAY-ADM-09).
import { Payment } from '../../billing/domain/payment.entity';
import { PaymentForm, PaymentStatus } from '../../billing/domain/payment-status.enum';
import type { DepositTerms } from '../domain/deposit-terms';
import { settleDeposit, type AppointmentOutcome } from '../domain/deposit-settlement';
import {
  DepositSettlementService,
  type DepositSettlementDeps,
  type SettlementPaymentRepository,
} from './deposit-settlement.service';

const TERMS: DepositTerms = {
  amount: 12000,
  percent: 30,
  rounding: 10,
  cancellationWindowHours: 4,
};

const START = new Date('2026-11-20T15:00:00Z'); // дедлайн 11:00 UTC
const inHours = (hours: number) => new Date(START.getTime() + hours * 3_600_000);

function policy(
  outcome: AppointmentOutcome,
  occurredAt: Date,
  captured = true,
  terms: DepositTerms | null = TERMS
) {
  return settleDeposit({ terms, outcome, appointmentStart: START, occurredAt, captured });
}

describe('settleDeposit (T-160, PAY-WEB-07)', () => {
  it('forfeits the deposit on a no-show inside the window and never refunds it (NSH-003)', () => {
    const settlement = policy('no_show', inHours(-0.25));

    expect(settlement.action).toBe('forfeit');
    expect(settlement.reason).toBe('no_show');
    expect(settlement.refundAmount).toBe(0);
    expect(settlement.retainedAmount).toBe(12000);
    expect(settlement.timely).toBe(false);
  });

  it('releases the deposit on a cancellation at or before the free-cancel deadline', () => {
    const atDeadline = policy('cancelled', inHours(-4));
    const early = policy('cancelled', inHours(-30));

    expect(atDeadline).toMatchObject({
      action: 'release',
      reason: 'timely_cancellation',
      refundAmount: 12000,
      timely: true,
    });
    expect(early).toMatchObject({ action: 'release', refundAmount: 12000, timely: true });
    expect(atDeadline.freeCancelDeadline?.toISOString()).toBe('2026-11-20T11:00:00.000Z');
  });

  it('forfeits the deposit on a late cancellation', () => {
    const settlement = policy('cancelled', inHours(-1));

    expect(settlement).toMatchObject({
      action: 'forfeit',
      reason: 'late_cancellation',
      refundAmount: 0,
      retainedAmount: 12000,
      timely: false,
    });
  });

  it('credits the deposit to the bill when the visit happened', () => {
    const settlement = policy('completed', inHours(0.5));

    expect(settlement).toMatchObject({
      action: 'release',
      reason: 'visit_completed',
      refundAmount: 0,
      retainedAmount: 0,
    });
  });

  it('carries the deposit over on a reschedule', () => {
    expect(policy('rescheduled', inHours(-1))).toMatchObject({
      action: 'carry_over',
      reason: 'rescheduled',
      refundAmount: 0,
      retainedAmount: 0,
    });
  });

  it('does nothing without deposit terms or without captured money', () => {
    expect(policy('no_show', inHours(-1), true, null)).toMatchObject({
      action: 'none',
      reason: 'no_deposit',
    });
    expect(policy('cancelled', inHours(-10), false)).toMatchObject({
      action: 'none',
      reason: 'not_captured',
    });
  });
});

function paidPayment(status = PaymentStatus.DEPOSIT_PAID): Payment {
  return new Payment({
    id: 'pay-1',
    clientId: 'client-1',
    amount: 12000,
    form: PaymentForm.CARD,
    status,
    traceId: 'trace-1',
    receiptId: 'check_12000',
    createdAt: new Date('2026-11-19T10:00:00Z'),
    updatedAt: new Date('2026-11-19T10:00:00Z'),
  });
}

function harness(options: { status?: PaymentStatus; withFiscal?: boolean } = {}) {
  const payments = new Map<string, Payment>([
    ['pay-1', paidPayment(options.status ?? PaymentStatus.DEPOSIT_PAID)],
  ]);
  const repo: SettlementPaymentRepository = {
    load: async (id) => payments.get(id) ?? null,
    save: async (payment) => {
      payments.set(payment.id, payment);
      return payment;
    },
  };
  const refund = jest.fn(async () => ({ refundId: 'refund-1' }));
  const issueRefundReceipt = jest.fn(async () => ({ checkId: 'check-refund-1' }));

  const deps: DepositSettlementDeps = {
    payments: repo,
    refunds: { refund },
    ...(options.withFiscal ? { fiscal: { issueRefundReceipt } } : {}),
  };

  return {
    service: new DepositSettlementService(deps),
    refund,
    issueRefundReceipt,
    payment: () => payments.get('pay-1'),
  };
}

describe('DepositSettlementService (T-160)', () => {
  it('keeps the captured deposit on a no-show without touching the payment', async () => {
    const { service, refund, issueRefundReceipt, payment } = harness({ withFiscal: true });

    const result = await service.settle({
      paymentId: 'pay-1',
      terms: TERMS,
      outcome: 'no_show',
      appointmentStart: START,
      occurredAt: inHours(-0.25),
    });

    expect(result.refunded).toBe(false);
    expect(result.retainedAmount).toBe(12000);
    expect(payment()?.status).toBe(PaymentStatus.DEPOSIT_PAID);
    expect(refund).not.toHaveBeenCalled();
    expect(issueRefundReceipt).not.toHaveBeenCalled(); // PAY-010: без реверсу
  });

  it('refunds a timely cancellation through the acquirer and issues the reversal receipt (PAY-010)', async () => {
    const { service, refund, issueRefundReceipt, payment } = harness({ withFiscal: true });

    const result = await service.settle({
      paymentId: 'pay-1',
      terms: TERMS,
      outcome: 'cancelled',
      appointmentStart: START,
      occurredAt: inHours(-8),
    });

    expect(result.refunded).toBe(true);
    expect(result.refundAmount).toBe(12000);
    expect(refund).toHaveBeenCalledWith(expect.objectContaining({ id: 'pay-1' }), 12000);
    expect(payment()?.status).toBe(PaymentStatus.REFUNDED);
    expect(issueRefundReceipt).toHaveBeenCalledTimes(1);
    expect(result.refundReceiptId).toBe('check-refund-1');
  });

  it('keeps a late cancellation inside the shop', async () => {
    const { service, refund, payment } = harness();

    const result = await service.settle({
      paymentId: 'pay-1',
      terms: TERMS,
      outcome: 'cancelled',
      appointmentStart: START,
      occurredAt: inHours(-2),
    });

    expect(result.action).toBe('forfeit');
    expect(result.refunded).toBe(false);
    expect(refund).not.toHaveBeenCalled();
    expect(payment()?.status).toBe(PaymentStatus.DEPOSIT_PAID);
  });

  it('credits the deposit to the bill when the visit completes', async () => {
    const { service, payment } = harness();

    const result = await service.settle({
      paymentId: 'pay-1',
      terms: TERMS,
      outcome: 'completed',
      appointmentStart: START,
      occurredAt: inHours(1),
    });

    expect(result.reason).toBe('visit_completed');
    expect(payment()?.status).toBe(PaymentStatus.AWAITING_BALANCE);
  });

  it('refuses to settle an unknown payment', async () => {
    const { service } = harness();

    await expect(
      service.settle({
        paymentId: 'missing',
        terms: TERMS,
        outcome: 'no_show',
        appointmentStart: START,
      })
    ).rejects.toThrow('Payment missing not found');
  });
});
