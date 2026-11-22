import { PrismaBookingPaymentRepository } from './prisma-booking-payment.repository';
import type { PrismaService } from '../../shared/prisma/prisma.service';

const start = new Date('2026-12-01T10:00:00Z');
const end = new Date('2026-12-01T11:00:00Z');

const bookingRow = {
  id: 'booking-1',
  barberId: 'barber-1',
  locationId: 'location-1',
  serviceId: null,
  agreedPrice: 1_000,
  appliedDiscounts: null,
  finalPrice: 1_000,
  agreedDuration: 60,
  fulfillmentMode: 'sequential',
  start,
  end,
  version: 0,
  haircutReferenceId: null,
  appointmentComment: null,
  clientId: 'client-1',
  source: 'web',
  status: 'pending',
  depositAmount: 300,
  depositPercent: 30,
  depositRounding: 10,
  cancellationWindowHours: 4,
};

function prismaStub() {
  return {
    booking: { findUnique: jest.fn(), update: jest.fn() },
    bookingPaymentState: { findUnique: jest.fn(), upsert: jest.fn() },
    $transaction: jest.fn(async (ops: unknown[]) => ops),
  };
}

describe('PrismaBookingPaymentRepository', () => {
  it('overlays persisted payment/refund state on the booking aggregate', async () => {
    const prisma = prismaStub();
    prisma.booking.findUnique.mockResolvedValue(bookingRow);
    prisma.bookingPaymentState.findUnique.mockResolvedValue({
      bookingId: 'booking-1',
      status: 'confirmed',
      requiresPayment: true,
      paymentMethod: 'cash',
      depositStatus: 'captured',
      discountReason: null,
      refundId: 'refund-1',
      refundStatus: 'completed',
      refundInitiatedAt: new Date('2026-11-20T10:00:00Z'),
      refundReason: 'cancellation',
      refundReasonCode: 'PAY-004',
      refundMetadata: '{"retryCount":0}',
      capturedRefundAmount: 300,
      updatedAt: new Date(),
    });

    const repo = new PrismaBookingPaymentRepository(prisma as unknown as PrismaService);
    const booking = await repo.findById('booking-1');

    expect(booking?.status).toBe('confirmed');
    expect(booking?.depositStatus).toBe('captured');
    expect(booking?.paymentMethod).toBe('cash');
    expect(booking?.refundId).toBe('refund-1');
    expect(booking?.refundStatus).toBe('completed');
    expect(booking?.capturedRefundAmount).toBe(300);
    expect(booking?.deposit).toEqual({ amount: 300, percent: 30, rounding: 10, cancellationWindowHours: 4 });
  });

  it('upserts state and keeps the booking status column in sync', async () => {
    const prisma = prismaStub();
    prisma.booking.findUnique.mockResolvedValue(bookingRow);
    prisma.bookingPaymentState.findUnique.mockResolvedValue(null);
    const repo = new PrismaBookingPaymentRepository(prisma as unknown as PrismaService);
    const booking = await repo.findById('booking-1');
    if (!booking) throw new Error('missing booking');
    booking.depositStatus = 'captured';
    booking.status = 'confirmed';

    await repo.save(booking);

    expect(prisma.bookingPaymentState.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { bookingId: 'booking-1' },
        update: expect.objectContaining({ depositStatus: 'captured', status: 'confirmed' }),
      })
    );
    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'booking-1' },
      data: { status: 'confirmed' },
    });
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('finds a booking by refund id', async () => {
    const prisma = prismaStub();
    prisma.bookingPaymentState.findUnique.mockResolvedValue({ bookingId: 'booking-1' });
    prisma.booking.findUnique.mockResolvedValue(bookingRow);
    const repo = new PrismaBookingPaymentRepository(prisma as unknown as PrismaService);

    const booking = await repo.findByRefundId('refund-1');
    expect(booking?.id).toBe('booking-1');
    expect(prisma.bookingPaymentState.findUnique).toHaveBeenCalledWith({
      where: { refundId: 'refund-1' },
    });
  });
});
