/* eslint-disable max-lines -- T-4616a: mark/list behaviour needs shared in-memory fixtures. */
// T-4616a: маркування недоступності лише відкриває конфлікти — статуси
// наявних візитів не змінюються. Список показує клієнта/послугу/час.
import {
  closeConflict,
  type BarberUnavailabilityData,
  type ShiftConflictData,
  type VisitRow,
} from '../domain/barber-unavailability';
import type {
  BarberUnavailabilityRepository,
  ShiftConflictAvailability,
  ShiftConflictRepository,
} from '../domain/shift-conflict-ports';
import { MarkBarberUnavailable } from './mark-barber-unavailable.use-case';
import { ListShiftConflicts } from './list-shift-conflicts.use-case';

const at = new Date('2026-11-23T08:00:00.000Z');
const interval = { start: '2026-11-24T09:00:00.000Z', end: '2026-11-24T18:00:00.000Z' };

const visit = (
  id: string,
  start: string,
  options: { status?: string | null; partyId?: string | null } = {}
): VisitRow => ({
  bookingId: `booking-${id}`,
  appointmentId: `appointment-${id}`,
  partyId: options.partyId ?? null,
  barberId: 'b1',
  locationId: 'loc1',
  clientId: `client-${id}`,
  serviceId: 'service-1',
  start: new Date(start),
  end: new Date(new Date(start).getTime() + 30 * 60000),
  status: options.status === undefined ? 'confirmed' : options.status,
});

class FakeUnavailabilities implements BarberUnavailabilityRepository {
  saved: BarberUnavailabilityData[] = [];
  constructor(public visits: VisitRow[]) {}
  async save(data: BarberUnavailabilityData) {
    this.saved.push(data);
  }
  async covers(input: { barberId: string; locationId: string; start: Date; end: Date }) {
    return this.saved.some(
      (row) =>
        row.barberId === input.barberId &&
        row.locationId === input.locationId &&
        row.start < input.end &&
        row.end > input.start
    );
  }
  async futureVisitsForBarber() {
    return this.visits;
  }
}

class FakeConflicts implements ShiftConflictRepository {
  rows: ShiftConflictData[] = [];
  async open(data: ShiftConflictData) {
    if (this.rows.some((row) => row.bookingId === data.bookingId)) return false;
    if (
      data.partyId &&
      this.rows.some((row) => row.partyId === data.partyId && row.status === 'open')
    ) {
      return false;
    }
    this.rows.push(data);
    return true;
  }
  async findById(id: string) {
    return this.rows.find((row) => row.id === id) ?? null;
  }
  async bookingIdsForParty(partyId: string) {
    return this.rows.filter((row) => row.partyId === partyId).map((row) => row.bookingId);
  }
  async listOpen() {
    return this.rows.filter((row) => row.status === 'open');
  }
  async close(
    id: string,
    input: { resolution: 'reassigned' | 'cancelled'; resolvedBarberId?: string; at: Date }
  ) {
    const row = await this.findById(id);
    if (!row || row.status === 'closed') return row;
    const closed = closeConflict(row, input);
    this.rows = this.rows.map((item) => (item.id === id ? closed : item));
    return closed;
  }
}

const defaultVisits = () => [
  visit('1', '2026-11-24T09:00:00.000Z'),
  visit('2', '2026-11-24T11:00:00.000Z'),
  visit('3', '2026-11-24T15:00:00.000Z', { status: 'completed' }),
];

const setup = (visits: VisitRow[] = defaultVisits()) => {
  const unavailabilities = new FakeUnavailabilities(visits);
  const conflicts = new FakeConflicts();
  const mark = new MarkBarberUnavailable({
    unavailabilities,
    conflicts,
    clock: { now: () => at },
  });
  return { visits, unavailabilities, conflicts, mark };
};

describe('MarkBarberUnavailable', () => {
  it('marks the interval without changing existing visit statuses and opens one conflict per future visit', async () => {
    const { visits, mark, conflicts } = setup();
    const before = visits.map((row) => ({ ...row }));

    const result = await mark.execute({
      id: 'unavailability-1',
      barberId: 'b1',
      locationId: 'loc1',
      ...interval,
      reason: 'sick',
      actorId: 'admin-1',
    });

    expect(result.conflictsCreated).toBe(2);
    expect(visits).toEqual(before);
    expect(conflicts.rows.map((row) => row.bookingId)).toEqual(['booking-1', 'booking-2']);
    expect(conflicts.rows.every((row) => row.status === 'open')).toBe(true);
  });

  it('supports a barber-wide interval when locationId is omitted', async () => {
    const { mark } = setup();

    const result = await mark.execute({
      barberId: 'b1',
      ...interval,
      actorId: 'admin-1',
    });

    expect(result.unavailability.locationId).toBeNull();
  });

  it('is idempotent: marking the same interval again does not duplicate conflicts', async () => {
    const { mark, conflicts } = setup();
    await mark.execute({ barberId: 'b1', locationId: 'loc1', ...interval, actorId: 'admin-1' });

    const again = await mark.execute({
      barberId: 'b1',
      locationId: 'loc1',
      ...interval,
      actorId: 'admin-1',
    });

    expect(again.conflictsCreated).toBe(0);
    expect(conflicts.rows).toHaveLength(2);
  });

  it('opens one conflict for a father-son party instead of one per leg', async () => {
    const { mark, conflicts } = setup([
      visit('father', '2026-11-24T09:00:00.000Z', { partyId: 'party-1' }),
      visit('son', '2026-11-24T09:30:00.000Z', { partyId: 'party-1' }),
    ]);

    const result = await mark.execute({
      barberId: 'b1',
      locationId: 'loc1',
      ...interval,
      actorId: 'admin-1',
    });

    expect(result.conflictsCreated).toBe(1);
    expect(conflicts.rows).toHaveLength(1);
    expect(conflicts.rows[0]).toMatchObject({
      bookingId: 'booking-father',
      partyId: 'party-1',
      start: new Date('2026-11-24T09:00:00.000Z'),
      end: new Date('2026-11-24T10:00:00.000Z'),
    });
  });

  it('lists open conflicts with visit, client, service, time and other-barber availability', async () => {
    const { mark, conflicts } = setup();
    await mark.execute({ barberId: 'b1', locationId: 'loc1', ...interval, actorId: 'admin-1' });
    const availability: ShiftConflictAvailability = {
      hasOtherBarber: async (conflict) => conflict.bookingId === 'booking-1',
    };
    const list = new ListShiftConflicts({
      conflicts,
      availability,
      names: {
        clientName: async (clientId) => (clientId ? `клієнт ${clientId}` : null),
        serviceName: async (serviceId) => (serviceId === 'service-1' ? 'Стрижка' : null),
      },
    });

    const rows = await list.execute({ barberId: 'b1' });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      bookingId: 'booking-1',
      clientId: 'client-1',
      serviceId: 'service-1',
      clientName: 'клієнт client-1',
      serviceName: 'Стрижка',
      otherBarberAvailable: true,
    });
    expect(rows[0]?.start).toEqual(new Date('2026-11-24T09:00:00.000Z'));
    expect(rows[1]?.otherBarberAvailable).toBe(false);
  });
});
