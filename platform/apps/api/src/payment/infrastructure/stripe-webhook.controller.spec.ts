/* eslint-disable max-lines -- one HTTP matrix keeps the webhook contract together */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import * as crypto from 'crypto';
import { Booking } from '../../scheduling/domain/booking';
import { Payment } from '../../billing/domain/payment.entity';
import { PaymentForm, PaymentStatus } from '../../billing/domain/payment-status.enum';
import type { PaymentRepository, OutboxPublisher } from '../../billing/domain/ports';
import type { DomainEvent } from '../../shared/domain/domain-event';
import { ProcessStripeWebhookHandler } from '../../billing/application/process-stripe-webhook.use-case';
import { StripeAcquiringGateway } from '../../billing/infrastructure/stripe-acquiring.gateway';
import {
  SettleWebhookCapture,
  type WebhookHoldOutcome,
  type WebhookSettlementBookings,
} from '../application/settle-webhook-capture.use-case';
import { StripeWebhookController } from './stripe-webhook.controller';

const SECRET = 'whsec_test_secret';

class MemoryPayments implements PaymentRepository {
  private readonly store = new Map<string, Payment>();

  async findById(id: string): Promise<Payment | null> {
    return this.store.get(id) ?? null;
  }

  async findByProviderSessionId(): Promise<Payment | null> {
    return null;
  }

  async save(payment: Payment): Promise<void> {
    this.store.set(payment.id, payment);
  }

  seed(payment: Payment): void {
    this.store.set(payment.id, payment);
  }

  clear(): void {
    this.store.clear();
  }
}

class MemoryOutbox implements OutboxPublisher {
  readonly events: DomainEvent[] = [];

  async append(events: DomainEvent[]): Promise<void> {
    this.events.push(...events);
  }
}

class MemoryBookings implements WebhookSettlementBookings {
  private readonly store = new Map<string, Booking>();
  saves = 0;

  async findById(id: string): Promise<Booking | null> {
    return this.store.get(id) ?? null;
  }

  async save(booking: Booking): Promise<void> {
    this.saves += 1;
    this.store.set(booking.id, booking);
  }

  seed(booking: Booking): void {
    this.store.set(booking.id, booking);
  }

  clear(): void {
    this.store.clear();
  }
}

function bookingFixture(status = 'confirmed'): Booking {
  return Booking.reconstitute({
    id: 'booking-1',
    barberId: 'barber-1',
    locationId: 'location-1',
    serviceId: 'service-1',
    agreedPrice: 500,
    appliedDiscounts: null,
    finalPrice: 500,
    agreedDuration: 60,
    fulfillmentMode: 'sequential',
    start: new Date('2026-11-26T09:00:00Z'),
    end: new Date('2026-11-26T10:00:00Z'),
    version: 1,
    haircutReferenceId: null,
    appointmentComment: null,
    clientId: 'client-1',
    source: 'client_web',
    status,
  });
}

function paymentFixture(status = PaymentStatus.AWAITING_DEPOSIT): Payment {
  return new Payment({
    id: 'payment-1',
    appointmentId: 'booking-1',
    clientId: 'client-1',
    amount: 150,
    form: PaymentForm.CARD,
    status,
    traceId: 'trace-webhook',
    createdAt: new Date('2026-11-26T08:00:00Z'),
    updatedAt: new Date('2026-11-26T08:00:00Z'),
  });
}

function signed(raw: string): { signature: string; body: string } {
  const timestamp = Math.floor(Date.now() / 1000);
  const digest = crypto
    .createHmac('sha256', SECRET)
    .update(`${timestamp}.${raw}`, 'utf8')
    .digest('hex');
  return { signature: `t=${timestamp},v1=${digest}`, body: raw };
}

function paidEvent(eventId = 'evt_paid_1'): string {
  return JSON.stringify({
    id: eventId,
    type: 'payment_intent.succeeded',
    data: { object: { id: 'pi_test_1', metadata: { paymentId: 'payment-1' }, amount_received: 150 } },
  });
}

describe('POST /payment/webhooks/stripe', () => {
  let app: INestApplication;
  let payments: MemoryPayments;
  let outbox: MemoryOutbox;
  let bookings: MemoryBookings;
  let gateway: StripeAcquiringGateway;
  let holdOutcome: WebhookHoldOutcome;
  const refundLateCapture = jest.fn(async () => ({ status: 'completed', refundId: 'refund-1' }));

  beforeAll(async () => {
    process.env.STRIPE_WEBHOOK_SECRET = SECRET;
    payments = new MemoryPayments();
    outbox = new MemoryOutbox();
    bookings = new MemoryBookings();
    gateway = new StripeAcquiringGateway();
    const moduleRef = await Test.createTestingModule({
      controllers: [StripeWebhookController],
      providers: [
        { provide: StripeAcquiringGateway, useValue: gateway },
        {
          provide: ProcessStripeWebhookHandler,
          useFactory: () =>
            new ProcessStripeWebhookHandler({
              payments,
              outbox,
              clock: { now: () => new Date('2026-11-26T09:05:00Z') },
            }),
        },
        {
          provide: SettleWebhookCapture,
          useFactory: () =>
            new SettleWebhookCapture({
              payments,
              bookings,
              holds: { capture: async () => ({ outcome: holdOutcome }) },
              lateCaptureRefunds: { refundLateCapture },
              clock: { now: () => new Date('2026-11-26T09:05:00Z') },
            }),
        },
      ],
    }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ rawBody: true });
    await app.init();
  });

  // Ті самі інстанси, що вже захоплені фабриками провайдерів: стан чистимо,
  // а не підміняємо репозиторій (інакше вебхук писав би в старий обʼєкт).
  beforeEach(() => {
    payments.clear();
    bookings.clear();
    outbox.events.length = 0;
    bookings.saves = 0;
    holdOutcome = 'captured';
    refundLateCapture.mockClear();
    payments.seed(paymentFixture());
    bookings.seed(bookingFixture());
  });

  afterAll(async () => {
    await app.close();
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  function post(body: string, signature?: string) {
    const call = request(app.getHttpServer()).post('/payment/webhooks/stripe');
    return signature
      ? call.set('stripe-signature', signature).set('content-type', 'application/json').send(body)
      : call.set('content-type', 'application/json').send(body);
  }

  it('rejects a payload whose signature does not match the raw body', async () => {
    const { body } = signed(paidEvent());
    const response = await post(body, 't=1,v1=deadbeef').expect(400);

    expect(response.body).toEqual({ received: false, error: 'invalid_signature' });
    expect(outbox.events).toHaveLength(0);
    expect((await payments.findById('payment-1'))?.status).toBe(PaymentStatus.AWAITING_DEPOSIT);
  });

  it('rejects a request without a signature header', async () => {
    const response = await post(signed(paidEvent()).body).expect(400);
    expect(response.body).toEqual({ received: false, error: 'signature_missing' });
  });

  it('rejects a signed payload that is not a provider event envelope', async () => {
    const { body, signature } = signed('{"id":"evt_bad"}');
    const response = await post(body, signature).expect(400);
    expect(response.body).toEqual({ received: false, error: 'invalid_payload' });
  });

  it('drives a signed capture event through the booking state', async () => {
    const { body, signature } = signed(paidEvent());
    const response = await post(body, signature).expect(200);

    expect(response.body.received).toBe(true);
    expect(response.body.processed).toBe(true);
    expect(response.body.settlement).toEqual({ outcome: 'confirmed', bookingId: 'booking-1' });
    expect((await payments.findById('payment-1'))?.status).toBe(PaymentStatus.PAID);
    expect(outbox.events.map((event) => event.type)).toEqual(['billing.payment.captured']);
    expect((await bookings.findById('booking-1'))?.depositStatus).toBe('captured');
  });

  it('makes a duplicate delivery a no-op through the idempotency check', async () => {
    const first = signed(paidEvent('evt_duplicate'));
    await post(first.body, first.signature).expect(200);
    const savesAfterFirst = bookings.saves;

    const second = signed(paidEvent('evt_duplicate'));
    const response = await post(second.body, second.signature).expect(200);

    expect(response.body.alreadyProcessed).toBe(true);
    expect(response.body.settlement).toEqual({ outcome: 'already_confirmed', bookingId: 'booking-1' });
    expect(outbox.events).toHaveLength(1);
    expect(bookings.saves).toBe(savesAfterFirst);
  });

  it('does not confirm or double-charge when a late capture arrives after the hold expired', async () => {
    const captureSession = jest.spyOn(gateway, 'createPaymentSession');
    holdOutcome = 'expired';
    const { body, signature } = signed(paidEvent('evt_late'));

    const response = await post(body, signature).expect(200);

    expect(response.body.settlement).toEqual({
      outcome: 'expired',
      bookingId: 'booking-1',
      refund: { status: 'completed', refundId: 'refund-1' },
    });
    const booking = await bookings.findById('booking-1');
    expect(booking?.depositStatus).toBe('expired');
    expect(booking?.status).toBe('confirmed');
    // Гроші списав провайдер: платіж записано один раз, а шлюз не викликано.
    expect((await payments.findById('payment-1'))?.status).toBe(PaymentStatus.PAID);
    expect(captureSession).not.toHaveBeenCalled();
    expect(refundLateCapture).toHaveBeenCalledTimes(1);
    expect(refundLateCapture).toHaveBeenCalledWith({
      bookingId: 'booking-1',
      paymentId: 'payment-1',
      amount: 150,
    });
    captureSession.mockRestore();
  });

  it('does not resurrect a cancelled visit on a capture event', async () => {
    bookings.seed(bookingFixture('cancelled'));
    const { body, signature } = signed(paidEvent('evt_cancelled'));

    const response = await post(body, signature).expect(200);

    expect(response.body.settlement.outcome).toBe('expired');
    const booking = await bookings.findById('booking-1');
    expect(booking?.status).toBe('cancelled');
    expect(refundLateCapture).toHaveBeenCalledTimes(1);
  });
});
