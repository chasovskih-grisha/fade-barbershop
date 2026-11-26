/* eslint-disable max-lines -- one scenario matrix keeps the webhook contract together */
import { Booking } from '../../scheduling/domain/booking';
import { Payment } from '../../billing/domain/payment.entity';
import { PaymentForm, PaymentStatus } from '../../billing/domain/payment-status.enum';
import {
  SettleWebhookCapture,
  type WebhookHoldOutcome,
  type WebhookSettlementBookings,
} from './settle-webhook-capture.use-case';

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
}

function booking(status = 'confirmed', depositStatus: string | null = null): Booking {
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
    ...(depositStatus ? { depositStatus } : {}),
  });
}

function payment(appointmentId: string | null = 'booking-1'): Payment {
  return new Payment({
    id: 'payment-1',
    ...(appointmentId ? { appointmentId } : {}),
    clientId: 'client-1',
    amount: 150,
    form: PaymentForm.CARD,
    status: PaymentStatus.PAID,
    traceId: 'trace-settle',
    createdAt: new Date('2026-11-26T08:00:00Z'),
    updatedAt: new Date('2026-11-26T08:00:00Z'),
  });
}

describe('SettleWebhookCapture', () => {
  let bookings: MemoryBookings;
  let holdOutcome: WebhookHoldOutcome;
  const refundLateCapture = jest.fn(async () => ({ status: 'processing', refundId: 'refund-1' }));

  function settleFor(seed: Payment) {
    return new SettleWebhookCapture({
      payments: { findById: async (id: string) => (id === seed.id ? seed : null) },
      bookings,
      holds: { capture: async () => ({ outcome: holdOutcome }) },
      lateCaptureRefunds: { refundLateCapture },
      clock: { now: () => new Date('2026-11-26T09:05:00Z') },
    });
  }

  beforeEach(() => {
    bookings = new MemoryBookings();
    bookings.seed(booking());
    holdOutcome = 'captured';
    refundLateCapture.mockClear();
  });

  it('confirms the visit when the chair hold is still ours', async () => {
    const result = await settleFor(payment()).execute('payment-1');

    expect(result).toEqual({ outcome: 'confirmed', bookingId: 'booking-1' });
    const stored = await bookings.findById('booking-1');
    expect(stored?.depositStatus).toBe('captured');
    expect(refundLateCapture).not.toHaveBeenCalled();
  });

  it('only promotes a pending visit and never rewrites a completed one', async () => {
    bookings.seed(booking('completed'));
    await settleFor(payment()).execute('payment-1');

    const stored = await bookings.findById('booking-1');
    expect(stored?.status).toBe('completed');
    expect(stored?.depositStatus).toBe('captured');
  });

  it('is idempotent when the deposit is already captured', async () => {
    bookings.seed(booking('confirmed', 'captured'));
    const result = await settleFor(payment()).execute('payment-1');

    expect(result.outcome).toBe('already_confirmed');
    expect(bookings.saves).toBe(0);
  });

  it('keeps a cancelled visit cancelled and refunds the late capture', async () => {
    bookings.seed(booking('cancelled'));
    const result = await settleFor(payment()).execute('payment-1');

    expect(result.outcome).toBe('expired');
    expect(result.refund).toEqual({ status: 'processing', refundId: 'refund-1' });
    expect((await bookings.findById('booking-1'))?.status).toBe('cancelled');
  });

  it('ignores order payments that hold no chair', async () => {
    const result = await settleFor(payment(null)).execute('payment-1');
    expect(result.outcome).toBe('ignored');
    expect(bookings.saves).toBe(0);
  });

  it('reports a missing payment without touching the booking', async () => {
    const result = await settleFor(payment()).execute('payment-unknown');
    expect(result.outcome).toBe('not_found');
    expect(bookings.saves).toBe(0);
  });
});
