import { PaymentCommandContext } from '../domain/ports';
import { AcquiringGateway } from '../domain/acquiring.gateway.interface';
import { Payment } from '../domain/payment.entity';
import { PaymentStatus, PaymentForm } from '../domain/payment-status.enum';
import { PaymentInitiated } from '../domain/payment-events';

export interface InitiatePaymentInput {
  paymentId: string;
  appointmentId?: string;
  orderId?: string;
  clientId: string;
  amount: number;
  form: PaymentForm;
  currency?: string;
  successUrl: string;
  cancelUrl: string;
  traceId: string;
  automaticCapture?: boolean;
}

export interface InitiatePaymentResult {
  paymentId: string;
  checkoutUrl: string;
  providerSessionId: string;
  captureStatus?: 'automatic' | 'manual';
}

export class InitiatePaymentHandler {
  constructor(
    private readonly ctx: PaymentCommandContext & { acquiringGateway: AcquiringGateway }
  ) {}

  async handle(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const existing = await this.ctx.payments.findById(input.paymentId);
    if (existing) {
      throw new Error(`Payment with ID ${input.paymentId} already exists`);
    }

    const now = this.ctx.clock.now();
    const session = await this.ctx.acquiringGateway.createPaymentSession({
      paymentId: input.paymentId,
      amount: input.amount,
      currency: input.currency || 'UAH',
      traceId: input.traceId,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      ...(input.automaticCapture !== undefined && { automaticCapture: input.automaticCapture }),
    });

    const payment = new Payment({
      id: input.paymentId,
      ...(input.appointmentId && { appointmentId: input.appointmentId }),
      ...(input.orderId && { orderId: input.orderId }),
      clientId: input.clientId,
      amount: input.amount,
      form: input.form,
      status: PaymentStatus.AWAITING_DEPOSIT,
      traceId: input.traceId,
      createdAt: now,
      updatedAt: now,
    });

    await this.ctx.payments.save(payment);
    await this.ctx.outbox.append([
      new PaymentInitiated({
        paymentId: payment.id,
        ...(payment.appointmentId && { appointmentId: payment.appointmentId }),
        ...(payment.orderId && { orderId: payment.orderId }),
        amount: payment.amount,
        providerSessionId: session.providerSessionId,
        traceId: input.traceId,
        ...(session.captureStatus !== undefined && { captureStatus: session.captureStatus }),
        occurredAt: now,
      }),
    ]);

    return {
      paymentId: payment.id,
      checkoutUrl: session.checkoutUrl,
      providerSessionId: session.providerSessionId,
      ...(session.captureStatus !== undefined && { captureStatus: session.captureStatus }),
    };
  }
}
