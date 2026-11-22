import { PrismaDepositHoldExpirySink } from './prisma-deposit-hold-expiry.sink';
import type { PrismaService } from '../../shared/prisma/prisma.service';

const AT = new Date('2026-11-20T10:20:00.000Z');
const INPUT = {
  appointmentId: 'booking-1',
  barberId: 'barber-1',
  locationId: 'loc-1',
  at: AT,
};

function prismaStub(count = 1) {
  const tx = {
    booking: { updateMany: jest.fn(async () => ({ count })) },
    outboxMessage: { create: jest.fn(async () => ({})) },
  };
  return { $transaction: jest.fn(async (work: (client: typeof tx) => Promise<unknown>) => work(tx)), tx };
}

describe('PrismaDepositHoldExpirySink (T-4619a)', () => {
  it('cancels the visit with deposit_expired and appends one outbox event', async () => {
    const prisma = prismaStub();
    const sink = new PrismaDepositHoldExpirySink(prisma as unknown as PrismaService);

    await sink.expire(INPUT);

    expect(prisma.tx.booking.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: 'booking-1' }),
      data: { status: 'cancelled', cancelReason: 'deposit_expired' },
    });
    expect(prisma.tx.outboxMessage.create).toHaveBeenCalledTimes(1);
    expect(prisma.tx.outboxMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        aggregateType: 'appointment',
        aggregateId: 'booking-1',
        type: 'scheduling.appointment.cancelled',
        payload: expect.objectContaining({
          reason: 'deposit_expired',
          barberId: 'barber-1',
          locationId: 'loc-1',
        }),
      }),
    });
  });

  it('appends nothing when the visit is already terminal', async () => {
    const prisma = prismaStub(0);
    const sink = new PrismaDepositHoldExpirySink(prisma as unknown as PrismaService);

    await sink.expire(INPUT);

    expect(prisma.tx.outboxMessage.create).not.toHaveBeenCalled();
  });
});
