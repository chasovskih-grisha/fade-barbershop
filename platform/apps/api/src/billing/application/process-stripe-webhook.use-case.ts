import { PaymentCommandContext } from '../domain/ports';
import { PaymentCaptured, PaymentFailed, PaymentDisputed, PaymentDisputeResolved, OrderPaid } from '../domain/payment-events';
import { PaymentStatus } from '../domain/payment-status.enum';
import { DomainEvent } from '../../shared/domain/domain-event';
import { Payment } from '../domain/payment.entity';

export class WebhookDeadLetterEvent extends DomainEvent {
  readonly type = 'billing.webhook.dead_letter';
  readonly payload: { eventId: string; eventType: string; reason: string; traceId: string };

  constructor(params: { eventId: string; eventType: string; reason: string; traceId: string; occurredAt: Date }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.eventId });
    this.payload = {
      eventId: params.eventId,
      eventType: params.eventType,
      reason: params.reason,
      traceId: params.traceId,
    };
  }
}

export interface ProcessStripeWebhookInput {
  eventId?: string;
  eventType: string;
  eventObject: {
    id: string;
    metadata?: {
      paymentId?: string;
      appointmentId?: string;
      orderId?: string;
    };
    amount_received?: number;
    amount?: number;
    last_payment_error?: {
      message?: string;
    };
    failure_message?: string;
  };
  traceId: string;
}

export interface ProcessStripeWebhookResult {
  processed: boolean;
  paymentId?: string;
  alreadyProcessed?: boolean;
  deadLettered?: boolean;
}

export class ProcessStripeWebhookHandler {
  private readonly processedEventIds = new Set<string>();

  constructor(private readonly ctx: PaymentCommandContext) {}

  async handle(input: ProcessStripeWebhookInput): Promise<ProcessStripeWebhookResult> {
    const eventId = input.eventId || input.eventObject.id;

    // Strict Webhook Idempotency Check
    if (eventId && this.processedEventIds.has(eventId)) {
      return { processed: true, alreadyProcessed: true };
    }

    const metadataPaymentId = input.eventObject.metadata?.paymentId;
    let payment: Payment | null = null;

    if (metadataPaymentId) {
      payment = await this.ctx.payments.findById(metadataPaymentId);
    }
    if (!payment && input.eventObject.id) {
      payment = await this.ctx.payments.findByProviderSessionId(input.eventObject.id);
    }

    if (!payment) {
      const now = this.ctx.clock.now();
      await this.ctx.outbox.append([
        new WebhookDeadLetterEvent({
          eventId,
          eventType: input.eventType,
          reason: 'Payment not found by metadata paymentId or provider session id',
          traceId: input.traceId,
          occurredAt: now,
        }),
      ]);
      if (eventId) {
        this.processedEventIds.add(eventId);
      }
      return { processed: false, deadLettered: true };
    }

    const res = await this.processEventForPayment(payment, input);
    if (eventId) {
      this.processedEventIds.add(eventId);
    }
    return res;
  }

  private async processEventForPayment(payment: Payment, input: ProcessStripeWebhookInput): Promise<ProcessStripeWebhookResult> {
    const now = this.ctx.clock.now();
    const paymentId = payment.id;

    if (input.eventType === 'payment_intent.succeeded' || input.eventType === 'checkout.session.completed') {
      if (payment.status === PaymentStatus.PAID) {
        return { processed: true, paymentId, alreadyProcessed: true };
      }
      const receiptId = `rcpt_${input.eventObject.id}_${now.getTime()}`;
      payment.markPaid(receiptId);
      await this.ctx.payments.save(payment);

      const events: DomainEvent[] = [
        new PaymentCaptured({
          paymentId: payment.id,
          ...(payment.appointmentId && { appointmentId: payment.appointmentId }),
          ...(payment.orderId && { orderId: payment.orderId }),
          amount: payment.amount,
          receiptId,
          traceId: input.traceId,
          occurredAt: now,
        }),
      ];

      if (payment.orderId) {
        events.push(
          new OrderPaid({
            orderId: payment.orderId,
            paymentId: payment.id,
            amount: payment.amount,
            receiptId,
            traceId: input.traceId,
            occurredAt: now,
          })
        );
      }

      await this.ctx.outbox.append(events);
      return { processed: true, paymentId };
    }

    if (input.eventType === 'payment_intent.payment_failed' || input.eventType === 'checkout.session.async_payment_failed') {
      const reason = input.eventObject.last_payment_error?.message || input.eventObject.failure_message || 'Stripe payment failed';
      await this.ctx.payments.save(payment);
      await this.ctx.outbox.append([
        new PaymentFailed({
          paymentId: payment.id,
          ...(payment.appointmentId && { appointmentId: payment.appointmentId }),
          ...(payment.orderId && { orderId: payment.orderId }),
          reason,
          traceId: input.traceId,
          occurredAt: now,
        }),
      ]);
      return { processed: true, paymentId };
    }

    if (input.eventType === 'charge.dispute.created') {
      const reason = (input.eventObject as any).reason || 'Charge dispute initiated by cardholder';
      payment.markDisputed(reason);
      await this.ctx.payments.save(payment);
      await this.ctx.outbox.append([
        new PaymentDisputed({
          paymentId: payment.id,
          ...(payment.appointmentId && { appointmentId: payment.appointmentId }),
          ...(payment.orderId && { orderId: payment.orderId }),
          amount: payment.amount,
          reason,
          traceId: input.traceId,
          occurredAt: now,
        }),
      ]);
      return { processed: true, paymentId };
    }

    if (input.eventType === 'charge.dispute.closed') {
      const status = (input.eventObject as any).status; // 'won' or 'lost'
      const won = status === 'won';
      payment.resolveDispute(won);
      await this.ctx.payments.save(payment);
      await this.ctx.outbox.append([
        new PaymentDisputeResolved({
          paymentId: payment.id,
          ...(payment.appointmentId && { appointmentId: payment.appointmentId }),
          ...(payment.orderId && { orderId: payment.orderId }),
          won,
          traceId: input.traceId,
          occurredAt: now,
        }),
      ]);
      return { processed: true, paymentId };
    }

    return { processed: false, paymentId };
  }
}
