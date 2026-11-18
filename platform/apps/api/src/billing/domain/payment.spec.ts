import { Payment } from './payment.entity';
import { PaymentStatus, PaymentForm } from './payment-status.enum';

describe('Payment Domain Aggregate', () => {
  it('creates payment successfully with initial awaiting_deposit status', () => {
    const payment = new Payment({
      id: 'pay-1',
      appointmentId: 'apt-1',
      clientId: 'client-1',
      amount: 300,
      form: PaymentForm.CARD,
      status: PaymentStatus.AWAITING_DEPOSIT,
      traceId: 'trace-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(payment.id).toBe('pay-1');
    expect(payment.status).toBe(PaymentStatus.AWAITING_DEPOSIT);
    expect(payment.traceId).toBe('trace-123');
  });

  it('progresses payment through deposit and refund lifecycle', () => {
    const payment = new Payment({
      id: 'pay-2',
      appointmentId: 'apt-2',
      clientId: 'client-2',
      amount: 500,
      form: PaymentForm.POS,
      status: PaymentStatus.AWAITING_DEPOSIT,
      traceId: 'trace-456',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    payment.markDepositPaid('rcpt-1');
    expect(payment.status).toBe(PaymentStatus.DEPOSIT_PAID);
    expect(payment.receiptId).toBe('rcpt-1');

    payment.markPaid('rcpt-2');
    expect(payment.status).toBe(PaymentStatus.PAID);

    payment.initiateRefund('Client cancellation within window');
    expect(payment.status).toBe(PaymentStatus.REFUNDING);
    expect(payment.refundReason).toBe('Client cancellation within window');

    payment.completeRefund('rcpt-refund');
    expect(payment.status).toBe(PaymentStatus.REFUNDED);
    expect(payment.receiptId).toBe('rcpt-refund');
  });

  it('handles refund failure and retry up to max 2 attempts', () => {
    const payment = new Payment({
      id: 'pay-3',
      appointmentId: 'apt-3',
      clientId: 'client-3',
      amount: 200,
      form: PaymentForm.CARD,
      status: PaymentStatus.PAID,
      traceId: 'trace-789',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    payment.initiateRefund('No show refund issue');
    payment.failRefund('Gateway timeout');
    expect(payment.status).toBe(PaymentStatus.REFUND_FAILED);
    expect(payment.retryCount).toBe(1);

    payment.retryRefund();
    expect(payment.status).toBe(PaymentStatus.REFUNDING);

    payment.failRefund('Gateway timeout again');
    expect(payment.status).toBe(PaymentStatus.REFUND_FAILED);
    expect(payment.retryCount).toBe(2);

    expect(() => payment.retryRefund()).toThrow('Maximum refund retry attempts');
  });

  it('supports partial refunds with cumulative tracking and partially_refunded status', () => {
    const payment = new Payment({
      id: 'pay-4',
      appointmentId: 'apt-4',
      clientId: 'client-4',
      amount: 1000,
      form: PaymentForm.CARD,
      status: PaymentStatus.PAID,
      traceId: 'trace-partial-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    payment.initiateRefund('Partial service adjustment', 300);
    expect(payment.status).toBe(PaymentStatus.REFUNDING);

    payment.completeRefund('rcpt-partial-1', 300);
    expect(payment.status).toBe(PaymentStatus.PARTIALLY_REFUNDED);
    expect(payment.refundedAmount).toBe(300);

    // Refund remaining
    payment.initiateRefund('Remainder refund', 700);
    payment.completeRefund('rcpt-partial-2', 700);
    expect(payment.status).toBe(PaymentStatus.REFUNDED);
    expect(payment.refundedAmount).toBe(1000);
  });
});
