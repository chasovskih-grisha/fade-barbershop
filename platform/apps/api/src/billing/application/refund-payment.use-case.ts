import { PaymentCommandContext } from '../domain/ports';
import { AcquiringGateway } from '../domain/acquiring.gateway.interface';
import { PaymentRefundedEvent } from '../domain/payment-events';

export interface RefundPaymentInput {
  paymentId: string;
  amount?: number;
  reason: string;
  traceId: string;
}

export interface RefundPaymentResult {
  paymentId: string;
  refundId: string;
  refundedAmount: number;
  status: string;
}

export class RefundPaymentHandler {
  constructor(private readonly ctx: PaymentCommandContext & { acquiringGateway: AcquiringGateway }) {}

  async handle(input: RefundPaymentInput): Promise<RefundPaymentResult> {
    const payment = await this.ctx.payments.findById(input.paymentId);
    if (!payment) {
      throw new Error(`Payment with ID ${input.paymentId} not found`);
    }

    const now = this.ctx.clock.now();
    const refundAmount = input.amount ?? (payment.amount - payment.refundedAmount);

    payment.initiateRefund(input.reason, refundAmount);
    await this.ctx.payments.save(payment);

    const refundResult = await this.ctx.acquiringGateway.refundPayment({
      providerSessionId: payment.id,
      amount: refundAmount,
      reason: input.reason,
      traceId: input.traceId,
    });

    const receiptId = `rcpt_ref_${refundResult.refundId}_${now.getTime()}`;
    payment.completeRefund(receiptId, refundAmount);
    await this.ctx.payments.save(payment);

    await this.ctx.outbox.append([
      new PaymentRefundedEvent({
        paymentId: payment.id,
        appointmentId: payment.appointmentId,
        amount: refundAmount,
        refundId: refundResult.refundId,
        traceId: input.traceId,
        occurredAt: now,
      }),
    ]);

    return {
      paymentId: payment.id,
      refundId: refundResult.refundId,
      refundedAmount: payment.refundedAmount,
      status: payment.status,
    };
  }
}
