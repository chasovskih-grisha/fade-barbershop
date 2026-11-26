// T-4616a/ADR 0056 §7: скасування через недоступність барбера звільняє крісло і
// проводить списаний депозит через справжній T-094 (не через заглушку), а
// повторне рішення не повертає гроші вдруге.
import { Booking } from '../../scheduling/domain/booking';
import { Payment } from '../../billing/domain/payment.entity';
import { PaymentForm, PaymentStatus } from '../../billing/domain/payment-status.enum';
import { T094Refund, type RefundBookingPort } from './refund.use-case';
import { BarberCancelSettlement } from './barber-cancel-settlement.use-case';

class MemoryBookings implements RefundBookingPort {
  private readonly store = new Map<string, Booking>();
  saves = 0;

  async findById(id: string): Promise<Booking | null> {
    return this.store.get(id) ?? null;
  }

  async findByRefundId(refundId: string): Promise<Booking | null> {
    return [...this.store.values()].find((booking) => booking.refundId === refundId) ?? null;
  }

  async save(booking: Booking): Promise<void> {
    this.saves += 1;
    this.store.set(booking.id, booking);
  }

  seed(booking: Booking): void {
    this.store.set(booking.id, booking);
  }
}

class MemoryPayments {
  private readonly store = new Map<string, Payment>();

  async findByAppointmentId(appointmentId: string): Promise<Payment[]> {
    return [...this.store.values()].filter((payment) => payment.appointmentId === appointmentId);
  }

  async save(payment: Payment): Promise<void> {
    this.store.set(payment.id, payment);
  }

  seed(payment: Payment): void {
    this.store.set(payment.id, payment);
  }
}

function booking(): Booking {
  return Booking.reconstitute({
    id: 'booking-1',
    barberId: 'barber-1',
    locationId: 'location-1',
    serviceId: 'service-1',
    agreedPrice: 700,
    appliedDiscounts: null,
    finalPrice: 700,
    agreedDuration: 60,
    fulfillmentMode: 'sequential',
    start: new Date('2026-11-27T09:00:00Z'),
    end: new Date('2026-11-27T10:00:00Z'),
    version: 1,
    haircutReferenceId: null,
    appointmentComment: null,
    clientId: 'client-1',
    source: 'client_web',
    status: 'cancelled',
    deposit: { amount: 210, percent: 30, rounding: 10, cancellationWindowHours: 4 },
  });
}

function depositPayment(status = PaymentStatus.DEPOSIT_PAID): Payment {
  return new Payment({
    id: 'payment-1',
    appointmentId: 'booking-1',
    clientId: 'client-1',
    amount: 210,
    form: PaymentForm.CARD,
    status,
    traceId: 'trace-barber-unavailable',
    createdAt: new Date('2026-11-26T08:00:00Z'),
    updatedAt: new Date('2026-11-26T08:00:00Z'),
  });
}

describe('BarberCancelSettlement (T-4616a)', () => {
  let bookings: MemoryBookings;
  let payments: MemoryPayments;
  let release: jest.Mock;
  let refundPayment: jest.Mock;
  let settlement: BarberCancelSettlement;

  beforeEach(() => {
    bookings = new MemoryBookings();
    bookings.seed(booking());
    payments = new MemoryPayments();
    payments.seed(depositPayment());
    release = jest.fn(async () => true);
    refundPayment = jest.fn(async (input: { amount: number }) => ({
      refundId: 're_1',
      refundedAmount: input.amount,
      feeReversed: 0,
    }));

    const refunds = new T094Refund(
      bookings,
      { issueRefundReceipt: async () => ({ receiptId: 'receipt-1', status: 'done' as const }) },
      () => new Date('2026-11-26T10:00:00Z'),
      payments as never,
      { refundPayment } as never
    );
    settlement = new BarberCancelSettlement({
      bookings: bookings as never,
      payments: payments as never,
      refunds,
      holds: { release },
    });
  });

  it('звільняє крісло і повертає списаний депозит', async () => {
    const result = await settlement.settle({ appointmentId: 'booking-1' });

    expect(result.outcome).toBe('refund_initiated');
    expect(result.amount).toBe(210);
    expect(result.holdReleased).toBe(true);
    expect(release).toHaveBeenCalledWith('booking-1');
    expect(refundPayment).toHaveBeenCalledTimes(1);
    const stored = await bookings.findById('booking-1');
    expect(stored?.refundId).toBe('barber_unavailable_booking-1');
    expect(stored?.refundStatus).not.toBeNull();
  });

  it('повторне рішення не повертає гроші вдруге', async () => {
    await settlement.settle({ appointmentId: 'booking-1' });
    const second = await settlement.settle({ appointmentId: 'booking-1' });

    expect(second.outcome).toBe('refund_replayed');
    expect(refundPayment).toHaveBeenCalledTimes(1);
  });

  it('візит без грошей лише звільняє крісло', async () => {
    payments = new MemoryPayments();
    settlement = new BarberCancelSettlement({
      bookings: bookings as never,
      payments: payments as never,
      refunds: { initiateRefund: jest.fn() },
      holds: { release },
    });

    const result = await settlement.settle({ appointmentId: 'booking-1' });

    expect(result.outcome).toBe('released_without_money');
    expect(result.holdReleased).toBe(true);
    expect(result.refundId).toBeUndefined();
  });

  it('збій еквайрингу не вдає, що гроші повернулись', async () => {
    refundPayment.mockRejectedValueOnce(new Error('provider timeout'));

    const result = await settlement.settle({ appointmentId: 'booking-1' });

    expect(result.outcome).toBe('refund_failed');
    expect(result.failureReason).toContain('provider timeout');
    expect(result.holdReleased).toBe(true);
  });
});
