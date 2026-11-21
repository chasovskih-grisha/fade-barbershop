import { RetrieveInvoiceHandler } from './retrieve-invoice.use-case';
import { Payment } from '../domain/payment.entity';
import { PaymentStatus, PaymentForm } from '../domain/payment-status.enum';
import { AcquiringGateway, InvoiceDetails } from '../domain/acquiring.gateway.interface';
import { PaymentRepository, OutboxPublisher } from '../domain/ports';
import { DomainEvent } from '../domain/domain-event';

class InMemoryPaymentRepository implements PaymentRepository {
  constructor(private readonly payments: Map<string, Payment> = new Map()) {}
  async findById(id: string): Promise<Payment | null> {
    return this.payments.get(id) || null;
  }
  async findByProviderSessionId(providerSessionId: string): Promise<Payment | null> {
    for (const p of this.payments.values()) {
      if (p.id === providerSessionId) return p;
    }
    return null;
  }
  async save(payment: Payment): Promise<void> {
    this.payments.set(payment.id, payment);
  }
}

class InMemoryOutbox implements OutboxPublisher {
  public events: DomainEvent[] = [];
  async append(events: DomainEvent[]): Promise<void> {
    this.events.push(...events);
  }
}

class MockAcquiringGateway implements AcquiringGateway {
  async createPaymentSession(): Promise<any> {
    return {};
  }
  async refundPayment(): Promise<any> {
    return {};
  }
  async verifyPaymentStatus(params: {
    paymentId: string;
    providerSessionId: string;
    traceId: string;
  }): Promise<{
    status: 'succeeded' | 'pending' | 'failed';
    amountReceived?: number;
    invoice?: InvoiceDetails;
  }> {
    const invoice: InvoiceDetails = {
      invoiceId: `inv_${params.paymentId}_custom`,
      taxRate: 0.2,
      taxAmount: 100,
      subtotal: 400,
      total: 500,
      issuedAt: new Date('2026-11-12T12:00:00Z'),
    };
    return {
      status: 'succeeded',
      amountReceived: 500,
      invoice,
    };
  }
}

describe('RetrieveInvoiceHandler', () => {
  it('successfully retrieves invoice details for a payment with trace correlation', async () => {
    const payment = new Payment({
      id: 'pay_inv_1',
      appointmentId: 'appt_1',
      clientId: 'client_1',
      amount: 500,
      form: PaymentForm.CARD,
      status: PaymentStatus.AWAITING_DEPOSIT,
      traceId: 'trace-inv-999',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const paymentsRepo = new InMemoryPaymentRepository(new Map([['pay_inv_1', payment]]));
    const outbox = new InMemoryOutbox();
    const acquiringGateway = new MockAcquiringGateway();

    const handler = new RetrieveInvoiceHandler({
      payments: paymentsRepo,
      outbox,
      acquiringGateway,
      clock: { now: () => new Date('2026-11-12T13:00:00Z') },
    });

    const result = await handler.handle({
      paymentId: 'pay_inv_1',
      traceId: 'trace-inv-999',
    });

    expect(result.paymentId).toBe('pay_inv_1');
    expect(result.traceId).toBe('trace-inv-999');
    expect(result.invoice.invoiceId).toBe('inv_pay_inv_1_custom');
    expect(result.invoice.total).toBe(500);
    expect(result.invoice.taxAmount).toBe(100);
  });
});
