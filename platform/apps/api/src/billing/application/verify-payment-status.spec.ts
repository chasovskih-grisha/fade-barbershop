import { Payment } from '../domain/payment.entity';
import { PaymentStatus, PaymentForm } from '../domain/payment-status.enum';
import { VerifyPaymentStatusHandler } from './verify-payment-status.use-case';
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
  public gatewayStatus: 'succeeded' | 'pending' | 'failed' = 'succeeded';

  async createPaymentSession(): Promise<{ checkoutUrl: string; providerSessionId: string }> {
    return { checkoutUrl: '', providerSessionId: '' };
  }

  async refundPayment(): Promise<{ refundId: string }> {
    return { refundId: 're_test_1' };
  }

  async verifyPaymentStatus(): Promise<{
    status: 'succeeded' | 'pending' | 'failed';
    amountReceived?: number;
  }> {
    return { status: this.gatewayStatus, amountReceived: 300 };
  }
}

describe('VerifyPaymentStatusHandler', () => {
  let repository: InMemoryPaymentRepository;
  let outbox: InMemoryOutbox;
  let gateway: MockAcquiringGateway;
  let handler: VerifyPaymentStatusHandler;

  beforeEach(() => {
    repository = new InMemoryPaymentRepository();
    outbox = new InMemoryOutbox();
    gateway = new MockAcquiringGateway();
    handler = new VerifyPaymentStatusHandler({
      payments: repository,
      acquiringGateway: gateway,
      outbox,
      clock: { now: () => new Date('2026-11-11T12:00:00Z') },
    });
  });

  it('reconciles stuck payment successfully when gateway reports succeeded', async () => {
    const payment = new Payment({
      id: 'pay-ver-1',
      appointmentId: 'apt-ver-1',
      clientId: 'client-1',
      amount: 300,
      form: PaymentForm.CARD,
      status: PaymentStatus.AWAITING_DEPOSIT,
      traceId: 'trace-ver-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repository.seed(payment);

    gateway.gatewayStatus = 'succeeded';

    const result = await handler.handle({
      paymentId: 'pay-ver-1',
      traceId: 'trace-ver-1',
    });

    expect(result.status).toBe('succeeded');
    expect(payment.status).toBe(PaymentStatus.DEPOSIT_PAID);
    expect(outbox.events.length).toBe(1);
    expect(outbox?.events?.[0]?.type).toBe('billing.payment.captured');
  });
});
