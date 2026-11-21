import { IssueFiscalReceiptHandler } from './issue-fiscal-receipt.use-case';
import { FiscalGateway } from '../domain/fiscal.gateway.interface';
import { PaymentRepository, OutboxPublisher, PaymentCommandContext } from '../domain/ports';
import { Payment } from '../domain/payment.entity';

class InMemoryPaymentRepository implements PaymentRepository {
  private map = new Map<string, Payment>();
  async findById(id: string): Promise<Payment | null> {
    return this.map.get(id) || null;
  }
  async findByProviderSessionId(): Promise<Payment | null> {
    return null;
  }
  async save(p: Payment): Promise<void> {
    this.map.set(p.id, p);
  }
}

class InMemoryOutbox implements OutboxPublisher {
  events: any[] = [];
  async append(events: any[]): Promise<void> {
    this.events.push(...events);
  }
}

class MockFiscalGateway implements FiscalGateway {
  async checkShiftOpen() {
    return { isOpen: true, openedAt: new Date() };
  }
  async createReceipt(p: any) {
    return {
      receiptId: `rcpt_${p.paymentId}`,
      fiscalCode: 'fc_123',
      status: 'DONE' as const,
      total: p.amount,
    };
  }
  async getReceiptStatus(p: any) {
    return { receiptId: p.receiptId, fiscalCode: 'fc_123', status: 'DONE' as const, total: 300 };
  }
}

describe('IssueFiscalReceiptHandler', () => {
  let handler: IssueFiscalReceiptHandler;
  let outbox: InMemoryOutbox;
  let fiscal: MockFiscalGateway;

  beforeEach(() => {
    outbox = new InMemoryOutbox();
    fiscal = new MockFiscalGateway();
    const payments = new InMemoryPaymentRepository();
    const ctx: PaymentCommandContext & { fiscalGateway: FiscalGateway } = {
      payments,
      outbox,
      clock: { now: () => new Date() },
      fiscalGateway: fiscal,
    };
    handler = new IssueFiscalReceiptHandler(ctx);
  });

  it('issues fiscal receipt successfully and appends ReceiptIssued event', async () => {
    const res = await handler.handle({
      paymentId: 'pay_1',
      appointmentId: 'apt_1',
      amount: 300,
      type: 'prepayment',
      items: [{ name: 'Deposit', price: 300, quantity: 1 }],
      traceId: 'tr_1',
    });

    expect(res.status).toBe('DONE');
    expect(res.receiptId).toBe('rcpt_pay_1');
    expect(outbox.events.length).toBe(1);
    expect(outbox.events[0].type).toBe('billing.receipt.issued');
  });

  it('guards against zero amount (PAY-003 / LYL-007)', async () => {
    await expect(
      handler.handle({
        paymentId: 'pay_2',
        appointmentId: 'apt_2',
        amount: 0,
        type: 'prepayment',
        items: [{ name: 'Zero', price: 0, quantity: 1 }],
        traceId: 'tr_2',
      })
    ).rejects.toThrow('ComplimentaryVisit or zero amount');
  });
});
