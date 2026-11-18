import { PrismaAppointmentPartyRepository } from './prisma-appointment-party.repository';
import { AppointmentParty } from '../domain/appointment-party.entity';
import { PartyLeg } from '../domain/party-leg.entity';
import { Slot } from '../domain/slot.value-object';

describe('PrismaAppointmentPartyRepository', () => {
  const party = () =>
    AppointmentParty.create({
      id: 'party-1',
      locationId: 'location-1',
      serviceId: 'service-1',
      date: new Date('2026-10-01T00:00:00Z'),
      mode: 'parallel',
      barberIds: ['barber-1', 'barber-2'],
      agreedPriceId: 'price-1',
      agreedPrice: 900,
      slots: [
        Slot.create(new Date('2026-10-01T09:00:00Z'), new Date('2026-10-01T09:50:00Z')),
        Slot.create(new Date('2026-10-01T09:00:00Z'), new Date('2026-10-01T09:45:00Z')),
      ],
      partyLegs: [
        PartyLeg.create({
          id: 'father',
          role: 'father',
          name: 'Father',
          age: 40,
          barberId: 'barber-1',
        }),
        PartyLeg.create({ id: 'son', role: 'son', name: 'Son', age: 10, barberId: 'barber-2' }),
      ],
    });

  const setup = (conflict = false) => {
    const appointmentPartyCreate = jest.fn();
    const bookingCreate = jest.fn();
    const tx = {
      chair: { count: jest.fn().mockResolvedValue(2) },
      booking: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(conflict ? { id: 'existing' } : null),
        create: bookingCreate,
      },
      appointmentParty: { create: appointmentPartyCreate },
    };
    const prisma = {
      $transaction: jest.fn(async (fn: (transaction: typeof tx) => Promise<void>) => fn(tx)),
    };
    return {
      repository: new PrismaAppointmentPartyRepository(prisma as never),
      tx,
      appointmentPartyCreate,
      bookingCreate,
      prisma,
    };
  };

  it('persists a party and two reservation rows atomically', async () => {
    const { repository, tx, appointmentPartyCreate, bookingCreate, prisma } = setup();
    await repository.save(party());
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
    expect(tx.booking.findFirst).toHaveBeenCalledTimes(2);
    expect(appointmentPartyCreate).toHaveBeenCalledTimes(1);
    expect(bookingCreate).toHaveBeenCalledTimes(2);
    expect(
      bookingCreate.mock.calls.map(([{ data }]) => [data.partyRole, data.end.toISOString()])
    ).toEqual([
      ['father', '2026-10-01T09:50:00.000Z'],
      ['son', '2026-10-01T09:45:00.000Z'],
    ]);
  });

  it('rejects an already booked barber before writing a party', async () => {
    const { repository, appointmentPartyCreate, bookingCreate } = setup(true);
    await expect(repository.save(party())).rejects.toThrow('already booked');
    expect(appointmentPartyCreate).not.toHaveBeenCalled();
    expect(bookingCreate).not.toHaveBeenCalled();
  });
});
