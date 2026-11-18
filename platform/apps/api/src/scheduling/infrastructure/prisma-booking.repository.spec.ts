import { Booking, BookingConflictError } from '../domain/booking';
import { PrismaBookingRepository } from './prisma-booking.repository';

describe('PrismaBookingRepository.save', () => {
  const booking = () =>
    Booking.create({
      barberId: 'barber-1',
      locationId: 'location-1',
      serviceId: 'service-1',
      agreedPrice: 500,
      start: new Date('2026-10-05T09:00:00Z'),
      end: new Date('2026-10-05T09:30:00Z'),
    });

  function setup(
    options: {
      chairs?: number;
      intervals?: { start: Date; end: Date }[];
      barberConflict?: boolean;
      txError?: unknown;
    } = {}
  ) {
    const tx = {
      chair: { count: jest.fn().mockResolvedValue(options.chairs ?? 2) },
      booking: {
        findMany: jest.fn().mockResolvedValue(options.intervals ?? []),
        findFirst: jest.fn().mockResolvedValue(options.barberConflict ? { id: 'existing' } : null),
        create: jest.fn().mockResolvedValue(undefined),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        async (callback: (client: typeof tx) => Promise<void>, _options: unknown) => {
          if (options.txError) throw options.txError;
          return callback(tx);
        }
      ),
    };
    return { repository: new PrismaBookingRepository(prisma as never), prisma, tx };
  }

  it('checks capacity and barber conflicts in a serializable transaction before inserting', async () => {
    const { repository, prisma, tx } = setup();
    await repository.save(booking());
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
    expect(tx.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          start: { lt: new Date('2026-10-05T09:30:00Z') },
          end: { gt: new Date('2026-10-05T09:00:00Z') },
        }),
      })
    );
    expect(tx.booking.findFirst).toHaveBeenCalled();
    expect(tx.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ barberId: 'barber-1' }) })
    );
  });

  it('зберігає снепшот умов депозиту разом із записом (PAY-ADM-09)', async () => {
    const { repository, tx } = setup();
    await repository.save(booking());

    expect(tx.booking.create.mock.calls[0][0].data).toMatchObject({
      depositAmount: 150, // 30% від 500
      depositPercent: 30,
      depositRounding: 10,
      cancellationWindowHours: 4,
    });
  });

  it('rejects full chair capacity without creating a booking', async () => {
    const { repository, tx } = setup({
      chairs: 2,
      intervals: [
        { start: new Date('2026-10-05T09:00:00Z'), end: new Date('2026-10-05T09:30:00Z') },
        { start: new Date('2026-10-05T09:00:00Z'), end: new Date('2026-10-05T09:30:00Z') },
      ],
    });
    await expect(repository.save(booking())).rejects.toBeInstanceOf(BookingConflictError);
    expect(tx.booking.create).not.toHaveBeenCalled();
  });

  it('rejects an already booked barber without creating a booking', async () => {
    const { repository, tx } = setup({ barberConflict: true });
    await expect(repository.save(booking())).rejects.toThrow('Barber is already booked');
    expect(tx.booking.create).not.toHaveBeenCalled();
  });

  it('maps serializable transaction conflicts to a refreshable booking conflict', async () => {
    const { repository } = setup({ txError: { code: 'P2034' } });
    await expect(repository.save(booking())).rejects.toThrow('refresh available slots');
  });
});
