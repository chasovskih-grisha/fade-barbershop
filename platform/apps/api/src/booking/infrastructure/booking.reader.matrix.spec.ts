// Крок 2 флоу запису (T-4521): `GET /booking/barbers/{locationId}?serviceId=`
// показує лише барберів, які виконують обрану послугу за матрицею. Без
// `serviceId` або з порожньою матрицею список не звужується (дефолт «все»).
import { BookingReader } from './booking.reader';
import { createLocation } from '../../locations/test-helpers.fakes';
import { User } from '../../identity/domain/user';
import { PhoneNumber } from '../../identity/domain/phone-number';
import type { BarberServiceAssignmentSnapshot } from '../../scheduling/domain/ports.barber-service-assignment';

const T0 = new Date('2026-11-12T10:00:00.000Z');

const barber = (id: string): User =>
  User.create({
    id,
    phone: PhoneNumber.of('+380501234567'),
    role: 'barber',
    name: id,
    active: true,
    createdAt: T0,
  });

const snapshot = (entries: Array<[string, string[]]>): BarberServiceAssignmentSnapshot => ({
  matrix: new Map(entries.map(([id, services]) => [id, new Map([['loc-1', new Set(services)]])])),
});

function makeReader(snapshotForLocation?: () => Promise<BarberServiceAssignmentSnapshot>) {
  const base = {
    locationRepo: { findById: async () => createLocation({ id: 'loc-1' }) } as never,
    userRepo: { listByRole: async () => [barber('b1'), barber('b2')] } as never,
    serviceRepo: {} as never,
    staffAssignments: {
      listByLocation: async () => [{ barberId: 'b1' }, { barberId: 'b2' }],
    } as never,
  };
  const deps = snapshotForLocation
    ? { ...base, assignments: { snapshotForLocation } as never }
    : base;
  return new BookingReader(deps);
}

describe('BookingReader.listBarbers — matrix filter (T-4521)', () => {
  it('з serviceId лишає лише барберів, призначених на послугу', async () => {
    const reader = makeReader(async () =>
      snapshot([
        ['b1', ['service-1']],
        ['b2', ['service-2']],
      ])
    );

    const listed = await reader.listBarbers('loc-1', 'service-1');

    expect(listed.map((b) => b.id)).toEqual(['', 'b1']);
  });

  it('без serviceId список не звужується', async () => {
    const reader = makeReader(async () => snapshot([['b1', ['service-1']]]));

    const listed = await reader.listBarbers('loc-1');

    expect(listed.map((b) => b.id)).toEqual(['', 'b1', 'b2']);
  });

  it('порожня матриця → фолбек на всіх барберів локації', async () => {
    const reader = makeReader(async () => ({ matrix: new Map() }));

    const listed = await reader.listBarbers('loc-1', 'service-1');

    expect(listed.map((b) => b.id)).toEqual(['', 'b1', 'b2']);
  });

  it('«Будь-який барбер» залишається першою опцією навіть при звуженні', async () => {
    const reader = makeReader(async () => snapshot([['b2', ['service-1']]]));

    const listed = await reader.listBarbers('loc-1', 'service-1');

    expect(listed[0]).toEqual({ id: '', name: 'Будь-який барбер', any: true });
    expect(listed.map((b) => b.id)).toEqual(['', 'b2']);
  });
});
