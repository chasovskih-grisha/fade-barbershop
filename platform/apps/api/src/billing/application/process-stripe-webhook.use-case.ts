/* eslint-disable max-lines, complexity, max-statements -- cohesive module (193 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 function with inherent domain branching (worst: an existing definition, complexity 20 vs 10); refactor tracked in T-2500f | 1 method with a single orchestration flow (worst: an existing definition, 32 statements vs 30); extraction tracked in T-2500f */
import { PaymentCommandContext } from '../domain/ports';
import {
  PaymentCaptured,
  PaymentFailed,
  PaymentDisputed,
  PaymentDisputeResolved,
  OrderPaid,
  PaymentRefundedEvent,
} from '../domain/payment-events';
import { PaymentStatus } from '../domain/payment-status.enum';
import { DomainEvent } from '../../shared/domain/domain-event';
import { Payment } from '../domain/payment.entity';

export class WebhookDeadLetterEvent extends DomainEvent {
  readonly type = 'billing.webhook.dead_letter';
  readonly payload: { eventId: string; eventType: string; reason: string; traceId: string };

  constructor(params: {
    eventId: string;
    eventType: string;
    reason: string;
    traceId: string;
    occurredAt: Date;
  }) {
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

    // Strict Webhook Idempotency Check. Повторна доставка все одно називає
    // платіж: після краху між handler-ом і закриттям крісла redelivery муси
    // довести settlement до кінця, а не загубити його.
    if (eventId && this.processedEventIds.has(eventId)) {
      const existingPayment = await this.findPayment(input);
      return {
        processed: true,
        alreadyProcessed: true,
        ...(existingPayment ? { paymentId: existingPayment.id } : {}),
      };
    }

    const payment = await this.findPayment(input);

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

  /** Платіж за `metadata.paymentId`, далі — за провайдерським session id. */
  private async findPayment(input: ProcessStripeWebhookInput): Promise<Payment | null> {
    const metadataPaymentId = input.eventObject.metadata?.paymentId;
    if (metadataPaymentId) {
      const byMetadata = await this.ctx.payments.findById(metadataPaymentId);
      if (byMetadata) return byMetadata;
    }
    if (!input.eventObject.id) return null;
    return this.ctx.payments.findByProviderSessionId(input.eventObject.id);
  }

  private async processEventForPayment(
    payment: Payment,
    input: ProcessStripeWebhookInput
  ): Promise<ProcessStripeWebhookResult> {
    const now = this.ctx.clock.now();
    const paymentId = payment.id;

    if (
      input.eventType === 'payment_intent.succeeded' ||
      input.eventType === 'checkout.session.completed'
    ) {
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

    if (
      input.eventType === 'payment_intent.payment_failed' ||
      input.eventType === 'checkout.session.async_payment_failed'
    ) {
      const reason =
        input.eventObject.last_payment_error?.message ||
        input.eventObject.failure_message ||
        'Stripe payment failed';
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

    if (
      input.eventType === 'payment_intent.refunded' ||
      input.eventType === 'charge.refunded' ||
      input.eventType === 'refund.failed'
    ) {
      const refundId = input.eventObject.id;
      const refundAmount = input.eventObject.amount ?? 0;
      const reason = input.eventObject.last_payment_error?.message ||
        input.eventObject.failure_message ||
        'Stripe refund event';

      if (payment.status === PaymentStatus.REFUNDED || payment.status === PaymentStatus.PARTIALLY_REFUNDED) {
        return { processed: true, paymentId, alreadyProcessed: true };
      }

      if (payment.status === PaymentStatus.REFUNDING) {
        // Refund was initiated internally or via webhook — complete it based on Stripe result
        const isFailure = input.eventType === 'refund.failed';
        payment.completeRefund(refundId, isFailure ? undefined : refundAmount);
        if (isFailure) {
          payment.failRefund(reason);
        }
        await this.ctx.payments.save(payment);
        await this.ctx.outbox.append([
          new PaymentRefundedEvent({
            paymentId: payment.id,
            ...(payment.appointmentId && { appointmentId: payment.appointmentId }),
            ...(payment.orderId && { orderId: payment.orderId }),
            amount: refundAmount,
            refundId,
            traceId: input.traceId,
            occurredAt: now,
          }),
        ]);
        return { processed: true, paymentId };
      }

      // Payment is in some other state (e.g. REFUND_FAILED from before) — try retry
      if (payment.status === PaymentStatus.REFUND_FAILED) {
        payment.retryRefund();
        await this.ctx.payments.save(payment);
        await this.ctx.outbox.append([
          new PaymentRefundedEvent({
            paymentId: payment.id,
            ...(payment.appointmentId && { appointmentId: payment.appointmentId }),
            ...(payment.orderId && { orderId: payment.orderId }),
            amount: refundAmount,
            refundId,
            traceId: input.traceId,
            occurredAt: now,
          }),
        ]);
        return { processed: true, paymentId };
      }

      // Default: just mark as processed
      await this.ctx.payments.save(payment);
      return { processed: true, paymentId };
    }
    return { processed: false, paymentId };
  }
}