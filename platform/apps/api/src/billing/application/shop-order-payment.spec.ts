import { Payment } from '../domain/payment.entity';
import { PaymentForm, PaymentStatus } from '../domain/payment-status.enum';
import { InitiatePaymentHandler } from './initiate-payment.use-case';
import { ProcessStripeWebhookHandler } from './process-stripe-webhook.use-case';
import { IssueFiscalReceiptHandler } from './issue-fiscal-receipt.use-case';
import { PaymentRepository, OutboxPublisher } from '../domain/ports';
import { AcquiringGateway } from '../domain/acquiring.gateway.interface';
import { FiscalGateway } from '../domain/fiscal.gateway.interface';
import { DomainEvent } from '../../shared/domain/domain-event';

class InMemoryPaymentRepository implements PaymentRepository {
  private store = new Map<string, Payment>();

  async findById(id: string): Promise<Payment | null> {
    return this.store.get(id) || null;
  }

  async findByProviderSessionId(sessionId: string): Promise<Payment | null> {
    for (const p of this.store.values()) {
      if (p.id === sessionId.replace('cs_test_', '')) {
        return p;
      }
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
    return { refundId: 're_order_123' };
  }

  async verifyPaymentStatus(): Promise<{ status: 'succeeded' | 'pending' | 'failed'; amountReceived?: number }> {
    return { status: 'succeeded' };
  }
}

class MockFiscalGateway implements FiscalGateway {
  async checkShiftOpen(): Promise<{ isOpen: boolean; openedAt?: Date; isTooLong?: boolean }> {
    return { isOpen: true, openedAt: new Date() };
  }

  async createReceipt(params: {
    paymentId: string;
    amount: number;
    type: string;
  }): Promise<{ receiptId: string; fiscalCode: string; status: string; total: number }> {
    return {
      receiptId: `rcpt_${params.paymentId}`,
      fiscalCode: 'fc_999999',
      status: 'DONE',
      total: params.amount,
    };
  }

  async getReceiptStatus(params: { receiptId: string }): Promise<{ receiptId: string; status: string; total: number }> {
    return { receiptId: params.receiptId, status: 'DONE', total: 1200 };
  }
}

describe('Shop Order Payment & Fiscalization (T-275 / SHOP-022 / SHOP-024)', () => {
  let repository: InMemoryPaymentRepository;
  let outbox: InMemoryOutbox;
  let acquiringGateway: MockAcquiringGateway;
  let fiscalGateway: MockFiscalGateway;
  let initiateHandler: InitiatePaymentHandler;
  let webhookHandler: ProcessStripeWebhookHandler;
  let issueReceiptHandler: IssueFiscalReceiptHandler;
  const clock = { now: () => new Date('2026-11-16T12:00:00Z') };

  beforeEach(() => {
    repository = new InMemoryPaymentRepository();
    outbox = new InMemoryOutbox();
    acquiringGateway = new MockAcquiringGateway();
    fiscalGateway = new MockFiscalGateway();
    initiateHandler = new InitiatePaymentHandler({ payments: repository, acquiringGateway, outbox, clock });
    webhookHandler = new ProcessStripeWebhookHandler({ payments: repository, outbox, clock });
    issueReceiptHandler = new IssueFiscalReceiptHandler({ payments: repository, fiscalGateway, outbox, clock });
  });

  it('initiates order payment and handles webhook success with OrderPaid event (SHOP-022)', async () => {
    const initResult = await initiateHandler.handle({
      paymentId: 'pay-ord-1',
      orderId: 'ord-100',
      clientId: 'client-1',
      amount: 1200,
      form: PaymentForm.CARD,
      successUrl: 'https://fade.com.ua/shop/success',
      cancelUrl: 'https://fade.com.ua/shop/cancel',
      traceId: 'trace-ord-1',
    });

    expect(initResult.paymentId).toBe('pay-ord-1');
    expect(initResult.checkoutUrl).toContain('cs_test_pay-ord-1');

    const payment = await repository.findById('pay-ord-1');
    expect(payment).not.toBeNull();
    expect(payment?.orderId).toBe('ord-100');
    expect(payment?.status).toBe(PaymentStatus.AWAITING_DEPOSIT);

    // Process stripe webhook success
    const webhookRes = await webhookHandler.handle({
      eventId: 'evt_1',
      eventType: 'checkout.session.completed',
      eventObject: {
        id: initResult.providerSessionId,
        metadata: { paymentId: 'pay-ord-1', orderId: 'ord-100' },
        amount_received: 1200,
      },
      traceId: 'trace-ord-1',
    });

    expect(webhookRes.processed).toBe(true);
    expect(webhookRes.paymentId).toBe('pay-ord-1');

    const updatedPayment = await repository.findById('pay-ord-1');
    expect(updatedPayment?.status).toBe(PaymentStatus.PAID);

    const orderPaidEvent = outbox.events.find((e) => e.type === 'billing.order.paid');
    expect(orderPaidEvent).toBeDefined();
    expect(orderPaidEvent?.payload).toMatchObject({
      orderId: 'ord-100',
      paymentId: 'pay-ord-1',
      amount: 1200,
    });
  });

  it('issues fiscal receipt for order distance trade (SHOP-024)', async () => {
    const payment = new Payment({
      id: 'pay-ord-2',
      orderId: 'ord-101',
      clientId: 'client-1',
      amount: 850,
      form: PaymentForm.CARD,
      status: PaymentStatus.PAID,
      traceId: 'trace-ord-2',
      createdAt: clock.now(),
      updatedAt: clock.now(),
    });
    await repository.save(payment);

    const receiptResult = await issueReceiptHandler.handle({
      paymentId: 'pay-ord-2',
      orderId: 'ord-101',
      amount: 850,
      type: 'sale',
      items: [{ name: 'Pomade', price: 850, quantity: 1 }],
      traceId: 'trace-ord-2',
    });

    expect(receiptResult.receiptId).toBe('rcpt_pay-ord-2');
    expect(receiptResult.status).toBe('DONE');

    const receiptIssued = outbox.events.find((e) => e.type === 'billing.receipt.issued');
    expect(receiptIssued).toBeDefined();
    expect(receiptIssued?.payload).toMatchObject({
      orderId: 'ord-101',
      amount: 850,
      type: 'sale',
    });
  });

  it('ensures loyalty services or appointments are not affected by order payment logic', async () => {
    const initResult = await initiateHandler.handle({
      paymentId: 'pay-apt-1',
      appointmentId: 'apt-500',
      clientId: 'client-1',
      amount: 500,
      form: PaymentForm.CARD,
      successUrl: 'https://fade.com.ua/success',
      cancelUrl: 'https://fade.com.ua/cancel',
      traceId: 'trace-apt-1',
    });

    expect(initResult.paymentId).toBe('pay-apt-1');
    const payment = await repository.findById('pay-apt-1');
    expect(payment?.appointmentId).toBe('apt-500');
    expect(payment?.orderId).toBeUndefined();

    const webhookRes = await webhookHandler.handle({
      eventId: 'evt_apt_1',
      eventType: 'checkout.session.completed',
      eventObject: {
        id: initResult.providerSessionId,
        metadata: { paymentId: 'pay-apt-1' },
        amount_received: 500,
      },
      traceId: 'trace-apt-1',
    });

    expect(webhookRes.processed).toBe(true);
    const orderPaidEvent = outbox.events.find((e) => e.type === 'billing.order.paid');
    expect(orderPaidEvent).toBeUndefined(); // order paid not triggered for appointment payment
  });
});
