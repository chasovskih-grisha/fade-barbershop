import { PaymentCommandContext } from '../domain/ports';
import { AcquiringGateway } from '../domain/acquiring.gateway.interface';
import { PaymentCaptured, PaymentFailed } from '../domain/payment-events';
import { PaymentStatus } from '../domain/payment-status.enum';

export interface VerifyPaymentStatusInput {
  paymentId: string;
  traceId: string;
}

export interface VerifyPaymentStatusResult {
  paymentId: string;
  status: 'succeeded' | 'pending' | 'failed';
  amountReceived?: number;
}

export class VerifyPaymentStatusHandler {
  constructor(private readonly ctx: PaymentCommandContext & { acquiringGateway: AcquiringGateway }) {}

  async handle(input: VerifyPaymentStatusInput): Promise<VerifyPaymentStatusResult> {
    const payment = await this.ctx.payments.findById(input.paymentId);
    if (!payment) {
      throw new Error(`Payment with ID ${input.paymentId} not found`);
    }

    const verification = await this.ctx.acquiringGateway.verifyPaymentStatus({
      paymentId: payment.id,
      providerSessionId: payment.id,
      traceId: input.traceId,
    });

    const now = this.ctx.clock.now();

    if (verification.status === 'succeeded' && payment.status !== PaymentStatus.PAID && payment.status !== PaymentStatus.DEPOSIT_PAID) {
      const receiptId = `rcpt_verify_${payment.id}_${now.getTime()}`;
      if (payment.status === PaymentStatus.AWAITING_DEPOSIT) {
        payment.markDepositPaid(receiptId);
      } else {
        payment.markPaid(receiptId);
      }
      await this.ctx.payments.save(payment);
      await this.ctx.outbox.append([
        new PaymentCaptured({
          paymentId: payment.id,
          appointmentId: payment.appointmentId,
          amount: verification.amountReceived !== undefined ? verification.amountReceived : payment.amount,
          receiptId,
          traceId: input.traceId,
          occurredAt: now,
        }),
      ]);
    } else if (verification.status === 'failed' && payment.status !== PaymentStatus.CANCELLED) {
      await this.ctx.payments.save(payment);
      await this.ctx.outbox.append([
        new PaymentFailed({
          paymentId: payment.id,
          appointmentId: payment.appointmentId,
          reason: 'Verified as failed via status API recovery',
          traceId: input.traceId,
          occurredAt: now,
        }),
      ]);
    }

    return {
      paymentId: payment.id,
      status: verification.status,
      ...(verification.amountReceived !== undefined ? { amountReceived: verification.amountReceived } : {}),
    };
  }
}
