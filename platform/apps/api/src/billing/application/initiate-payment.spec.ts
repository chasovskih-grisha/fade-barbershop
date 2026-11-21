import { Payment } from '../domain/payment.entity';
import { PaymentForm } from '../domain/payment-status.enum';
import { InitiatePaymentHandler } from './initiate-payment.use-case';
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
  async createPaymentSession(params: {
    paymentId: string;
    amount: number;
    currency: string;
    traceId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ checkoutUrl: string; providerSessionId: string }> {
    return {
      checkoutUrl: `https://checkout.stripe.com/pay/cs_test_${params.paymentId}`,
      providerSessionId: `cs_test_${params.paymentId}`,
    };
  }

  async refundPayment(): Promise<{ refundId: string }> {
    return { refundId: 're_123' };
  }

  async verifyPaymentStatus(): Promise<{
    status: 'succeeded' | 'pending' | 'failed';
    amountReceived?: number;
  }> {
    return { status: 'succeeded' };
  }
}

describe('InitiatePaymentHandler', () => {
  let repository: InMemoryPaymentRepository;
  let outbox: InMemoryOutbox;
  let gateway: MockAcquiringGateway;
  let handler: InitiatePaymentHandler;

  beforeEach(() => {
    repository = new InMemoryPaymentRepository();
    outbox = new InMemoryOutbox();
    gateway = new MockAcquiringGateway();
    handler = new InitiatePaymentHandler({
      payments: repository,
      acquiringGateway: gateway,
      outbox,
      clock: { now: () => new Date('2026-11-11T12:00:00Z') },
    });
  });

  it('initiates payment session and records payment', async () => {
    const result = await handler.handle({
      paymentId: 'pay-init-1',
      appointmentId: 'apt-init-1',
      clientId: 'client-1',
      amount: 500,
      form: PaymentForm.CARD,
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      traceId: 'trace-init-1',
    });

    expect(result.paymentId).toBe('pay-init-1');
    expect(result.checkoutUrl).toContain('cs_test_pay-init-1');
    expect(outbox.events.length).toBe(1);
    expect(outbox?.events?.[0]?.type).toBe('billing.payment.initiated');
  });

  it('prevents duplicate payment creation on double click / existing payment ID', async () => {
    const input = {
      paymentId: 'pay-dup-1',
      appointmentId: 'apt-dup-1',
      clientId: 'client-1',
      amount: 300,
      form: PaymentForm.CARD,
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      traceId: 'trace-dup-1',
    };

    await handler.handle(input);

    await expect(handler.handle(input)).rejects.toThrow(/Payment with ID pay-dup-1 already exists/);
  });
});
