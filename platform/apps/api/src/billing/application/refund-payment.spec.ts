import { Payment } from '../domain/payment.entity';
import { PaymentStatus, PaymentForm } from '../domain/payment-status.enum';
import { RefundPaymentHandler } from './refund-payment.use-case';
import { PaymentRepository, OutboxPublisher } from '../domain/ports';
import { AcquiringGateway } from '../domain/acquiring.gateway.interface';
import { DomainEvent } from '../../shared/domain/domain-event';

class InMemoryPaymentRepository implements PaymentRepository {
  private store = new Map<string, Payment>();

  async findById(id: string): Promise<Payment | null> {
    return this.store.get(id) || null;
  }

  async findByProviderSessionId(): Promise<Payment | null> {
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

class MockAcquiringGateway implements AcquiringGateway {
  async createPaymentSession(): Promise<{ checkoutUrl: string; providerSessionId: string }> {
    return { checkoutUrl: '', providerSessionId: '' };
  }

  async refundPayment(): Promise<{ refundId: string }> {
    return { refundId: 're_test_999' };
  }

  async verifyPaymentStatus(): Promise<{ status: 'succeeded' | 'pending' | 'failed'; amountReceived?: number }> {
    return { status: 'succeeded' };
  }
}

describe('RefundPaymentHandler', () => {
  let repository: InMemoryPaymentRepository;
  let outbox: InMemoryOutbox;
  let gateway: MockAcquiringGateway;
  let handler: RefundPaymentHandler;

  beforeEach(() => {
    repository = new InMemoryPaymentRepository();
    outbox = new InMemoryOutbox();
    gateway = new MockAcquiringGateway();
    handler = new RefundPaymentHandler({
      payments: repository,
      acquiringGateway: gateway,
      outbox,
      clock: { now: () => new Date('2026-11-11T12:00:00Z') },
    });
  });

  it('refunds paid payment successfully', async () => {
    const payment = new Payment({
      id: 'pay-ref-1',
      appointmentId: 'apt-ref-1',
      clientId: 'client-1',
      amount: 600,
      form: PaymentForm.CARD,
      status: PaymentStatus.PAID,
      traceId: 'trace-ref-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repository.seed(payment);

    const result = await handler.handle({
      paymentId: 'pay-ref-1',
      reason: 'Client cancellation within window',
      traceId: 'trace-ref-1',
    });

    expect(result.paymentId).toBe('pay-ref-1');
    expect(result.refundId).toBe('re_test_999');
    expect(payment.status).toBe(PaymentStatus.REFUNDED);
    expect(outbox.events.length).toBe(1);
    expect(outbox.events[0]!.type).toBe('billing.payment.refunded');
  });

  it('handles partial refund successfully', async () => {
    const payment = new Payment({
      id: 'pay-ref-2',
      appointmentId: 'apt-ref-2',
      clientId: 'client-2',
      amount: 1000,
      form: PaymentForm.CARD,
      status: PaymentStatus.PAID,
      traceId: 'trace-ref-2',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repository.seed(payment);

    const result = await handler.handle({
      paymentId: 'pay-ref-2',
      amount: 400,
      reason: 'Partial service change',
      traceId: 'trace-ref-2',
    });

    expect(result.paymentId).toBe('pay-ref-2');
    expect(result.refundedAmount).toBe(400);
    expect(payment.status).toBe(PaymentStatus.PARTIALLY_REFUNDED);
    expect(payment.refundedAmount).toBe(400);
  });
});
