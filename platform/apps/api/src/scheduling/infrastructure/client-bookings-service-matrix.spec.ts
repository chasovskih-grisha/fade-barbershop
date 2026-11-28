// Крок 2 флоу запису на сервері (T-041): прямий POST /booking/bookings не
// створює візит барберу, який не виконує обрану послугу.
import { Test } from '@nestjs/testing';
import { CLIENT_BOOKINGS_IO, ClientBookingsController } from './client-bookings.controller';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { SlotReservations } from '../application/slot-reservations.service';

const matrix = new Map([
  ['barber-1', new Map([['loc-1', new Set(['haircut'])]])],
  ['barber-2', new Map([['loc-1', new Set(['beard'])]])],
]);

const prisma = { client: { findUnique: async () => null } } as unknown as PrismaService;

const dto = {
  locationId: 'loc-1',
  serviceId: 'haircut',
  barberId: 'barber-2',
  date: '2026-12-01',
  start: '10:00',
  end: '10:45',
};

function deps(overrides: Record<string, unknown> = {}) {
  return {
    locationRepo: { findById: async () => ({ id: 'loc-1', active: true, hours: {} }) },
    services: {
      find: async () => ({ amount: 600, active: true }),
      findById: async () => ({ id: 'haircut', duration: 45, active: true }),
    },
    barberServices: { snapshotForLocation: async () => ({ matrix }) },
    ...overrides,
  };
}

async function build(overrides: Record<string, unknown> = {}) {
  const moduleRef = await Test.createTestingModule({
    controllers: [ClientBookingsController],
    providers: [
      { provide: CLIENT_BOOKINGS_IO, useValue: deps(overrides) },
      { provide: PrismaService, useValue: prisma },
      { provide: SlotReservations, useValue: { reserve: async () => ({ id: 'hold' }) } },
    ],
  }).compile();
  return moduleRef.get(ClientBookingsController);
}

const create = (controller: ClientBookingsController, overrides: Record<string, unknown> = {}) =>
  controller.create({ ...dto, ...overrides } as never, { headers: {} } as never);

const errorOf = (controller: ClientBookingsController, overrides: Record<string, unknown> = {}) =>
  create(controller, overrides).then(
    () => null,
    (error: unknown) => error as { status?: number; message?: string }
  );

describe('Client booker and the barber x service matrix', () => {
  it('refuses a barber that does not perform the requested service', async () => {
    const controller = await build();
    const error = await errorOf(controller);
    expect(error).toMatchObject({
      status: 422,
      message: 'Barber does not perform this service',
    });
  });

  it('lets the assigned barber through to slot handling', async () => {
    const controller = await build();
    const error = await errorOf(controller, { barberId: 'barber-1' });
    expect(error?.message).not.toBe('Barber does not perform this service');
  });

  it('keeps the all-services default when the matrix port is absent', async () => {
    const controller = await build({ barberServices: undefined });
    const error = await errorOf(controller);
    expect(error?.message).not.toBe('Barber does not perform this service');
  });
});
