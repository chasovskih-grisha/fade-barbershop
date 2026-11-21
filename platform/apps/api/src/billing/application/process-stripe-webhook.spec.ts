/* eslint-disable max-lines -- cohesive module (175 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
import { Payment } from '../domain/payment.entity';
import { PaymentStatus, PaymentForm } from '../domain/payment-status.enum';
import { ProcessStripeWebhookHandler } from './process-stripe-webhook.use-case';
import { PaymentRepository, OutboxPublisher } from '../domain/ports';
import { DomainEvent } from '../../shared/domain/domain-event';

class InMemoryPaymentRepository implements PaymentRepository {
  private store = new Map<string, Payment>();

  async findById(id: string): Promise<Payment | null> {
    return this.store.get(id) || null;
  }

  async findByProviderSessionId(providerSessionId: string): Promise<Payment | null> {
    for (const p of this.store.values()) {
      if (p.id === providerSessionId) return p;
    }
    return null;
  }

  async save(payment: Payment): Promise<void> {
    this.store.set(payment.id, payment);
  }

  seed(payment: Payment) {
    this.store.set(payment.id, payment);
  }
}

class InMemoryOutbox implements OutboxPublisher {
  public events: DomainEvent[] = [];

  async append(events: DomainEvent[]): Promise<void> {
    this.events.push(...events);
  }
}

describe('ProcessStripeWebhookHandler', () => {
  let repository: InMemoryPaymentRepository;
  let outbox: InMemoryOutbox;
  let handler: ProcessStripeWebhookHandler;

  beforeEach(() => {
    repository = new InMemoryPaymentRepository();
    outbox = new InMemoryOutbox();
    handler = new ProcessStripeWebhookHandler({
      payments: repository,
      outbox,
      clock: { now: () => new Date('2026-11-10T12:00:00Z') },
    });
  });

  it('processes payment_intent.succeeded webhook and captures payment', async () => {
    const payment = new Payment({
      id: 'pay-webhook-1',
      appointmentId: 'apt-1',
      clientId: 'client-1',
      amount: 600,
      form: PaymentForm.CARD,
      status: PaymentStatus.AWAITING_BALANCE,
      traceId: 'trace-wh-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repository.seed(payment);

    const result = await handler.handle({
      eventId: 'evt_111',
      eventType: 'payment_intent.succeeded',
      eventObject: {
        id: 'pi_test_123',
        metadata: { paymentId: 'pay-webhook-1', appointmentId: 'apt-1' },
      },
      traceId: 'trace-wh-1',
    });

    expect(result.processed).toBe(true);
    expect(result.paymentId).toBe('pay-webhook-1');
    expect(payment.status).toBe(PaymentStatus.PAID);
    expect(outbox.events.length).toBe(1);
    expect(outbox?.events?.[0]?.type).toBe('billing.payment.captured');
  });

  it('rejects duplicate webhook delivery by eventId idempotency check', async () => {
    const payment = new Payment({
      id: 'pay-webhook-dup',
      appointmentId: 'apt-dup',
      clientId: 'client-dup',
      amount: 400,
      form: PaymentForm.CARD,
      status: PaymentStatus.AWAITING_BALANCE,
      traceId: 'trace-wh-dup',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repository.seed(payment);

    const firstResult = await handler.handle({
      eventId: 'evt_duplicate_test',
      eventType: 'payment_intent.succeeded',
      eventObject: {
        id: 'pi_test_dup',
        metadata: { paymentId: 'pay-webhook-dup' },
      },
      traceId: 'trace-wh-dup',
    });
    expect(firstResult.processed).toBe(true);
    expect(outbox.events.length).toBe(1);

    // Second call with same eventId
    const secondResult = await handler.handle({
      eventId: 'evt_duplicate_test',
      eventType: 'payment_intent.succeeded',
      eventObject: {
        id: 'pi_test_dup',
        metadata: { paymentId: 'pay-webhook-dup' },
      },
      traceId: 'trace-wh-dup',
    });
    expect(secondResult.processed).toBe(true);
    expect(secondResult.alreadyProcessed).toBe(true);
    // Outbox should not receive duplicate capture events
    expect(outbox.events.length).toBe(1);
  });

  it('records dead-letter event when webhook event cannot be matched to any payment', async () => {
    const result = await handler.handle({
      eventId: 'evt_unknown',
      eventType: 'payment_intent.succeeded',
      eventObject: {
        id: 'pi_unknown',
        metadata: { paymentId: 'pay-nonexistent' },
      },
      traceId: 'trace-dlq',
    });

    expect(result.processed).toBe(false);
    expect(result.deadLettered).toBe(true);
    expect(outbox.events.length).toBe(1);
    expect(outbox?.events?.[0]?.type).toBe('billing.webhook.dead_letter');
  });

  it('processes payment_intent.payment_failed webhook and records failure event', async () => {
    const payment = new Payment({
      id: 'pay-webhook-2',
      appointmentId: 'apt-2',
      clientId: 'client-2',
      amount: 300,
      form: PaymentForm.CARD,
      status: PaymentStatus.AWAITING_DEPOSIT,
      traceId: 'trace-wh-2',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repository.seed(payment);

    const result = await handler.handle({
      eventType: 'payment_intent.payment_failed',
      eventObject: {
        id: 'pi_test_456',
        metadata: { paymentId: 'pay-webhook-2' },
        last_payment_error: { message: 'Insufficient funds' },
      },
      traceId: 'trace-wh-2',
    });

    expect(result.processed).toBe(true);
    expect(outbox.events.length).toBe(1);
    expect(outbox?.events?.[0]?.type).toBe('billing.payment.failed');
  });

  it('handles duplicate webhook delivery idempotently when payment is already paid', async () => {
    const payment = new Payment({
      id: 'pay-webhook-3',
      appointmentId: 'apt-3',
      clientId: 'client-3',
      amount: 500,
      form: PaymentForm.CARD,
      status: PaymentStatus.PAID,
      receiptId: 'rcpt_existing',
      traceId: 'trace-wh-3',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repository.seed(payment);

    const result = await handler.handle({
      eventType: 'payment_intent.succeeded',
      eventObject: {
        id: 'pi_test_789',
        metadata: { paymentId: 'pay-webhook-3' },
      },
      traceId: 'trace-wh-3',
    });

    expect(result.processed).toBe(true);
    expect(result.alreadyProcessed).toBe(true);
    expect(outbox.events.length).toBe(0);
  });
});
