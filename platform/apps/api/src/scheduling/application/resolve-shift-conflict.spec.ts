/* eslint-disable max-lines -- T-4616a: per-visit isolation fixtures and replay assertions. */
// T-4616a: рішення по кожному візиту окремо; збій одного не відкочує інші,
// повторне рішення для closed — no-op без другої події.
import { closeConflict, type ShiftConflictData } from '../domain/barber-unavailability';
import type { ShiftConflictRepository } from '../domain/shift-conflict-ports';
import type { BarberServiceAssignmentSnapshot } from '../domain/ports.barber-service-assignment';
import type { DayOffData } from '../domain/day-off';
import { ResolveShiftConflict } from './resolve-shift-conflict.use-case';

const at = new Date('2026-11-23T08:00:00.000Z');
const conflict = (
  id: string,
  bookingId: string,
  partyId: string | null = null
): ShiftConflictData => ({
  id,
  appointmentId: `appointment-${id}`,
  bookingId,
  partyId,
  barberId: 'b1',
  locationId: 'loc1',
  clientId: `client-${id}`,
  serviceId: 'service-1',
  start: new Date('2026-11-24T09:00:00.000Z'),
  end: new Date('2026-11-24T09:30:00.000Z'),
  status: 'open',
  resolution: null,
  resolvedBarberId: null,
  resolvedAt: null,
  createdAt: at,
});

class FakeConflicts implements ShiftConflictRepository {
  constructor(
    public rows: ShiftConflictData[],
    private readonly partyBookings: Record<string, string[]> = {}
  ) {}
  async open() {
    return false;
  }
  async findById(id: string) {
    return this.rows.find((row) => row.id === id) ?? null;
  }
  async bookingIdsForParty(partyId: string) {
    return this.partyBookings[partyId] ?? [];
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

const matrix: BarberServiceAssignmentSnapshot = {
  matrix: new Map([['b2', new Map([['loc1', new Set(['service-1'])]])]]),
};

const setup = (
  options: {
    unavailableBarbers?: string[];
    dayOffs?: DayOffData[];
    partyBookings?: Record<string, string[]>;
  } = {}
) => {
  const conflicts = new FakeConflicts(
    [
      conflict('c1', 'booking-1'),
      conflict('c2', 'booking-2'),
      conflict('c3', 'booking-3'),
      conflict('c4', 'booking-father', 'party-1'),
    ],
    options.partyBookings
  );
  const rescheduled: unknown[] = [];
  const cancelled: unknown[] = [];
  const events: string[] = [];
  let transactions = 0;
  const resolve = new ResolveShiftConflict({
    conflicts,
    barberServices: { snapshotForLocation: async () => matrix },
    unavailabilities: {
      covers: async ({ barberId }) => (options.unavailableBarbers ?? []).includes(barberId),
    },
    dayOffs: {
      findByBarberId: async (barberId) =>
        (options.dayOffs ?? []).filter((dayOff) => dayOff.barberId === barberId),
    },
    reschedule: {
      handle: async (cmd) => {
        rescheduled.push(cmd);
        events.push('rescheduled');
      },
    },
    cancel: {
      cancel: async (cmd) => {
        cancelled.push(cmd);
        events.push('cancelled');
      },
    },
    uow: {
      run: async (work) => {
        transactions += 1;
        return work();
      },
    },
    clock: { now: () => at },
  });
  return {
    conflicts,
    rescheduled,
    cancelled,
    events,
    resolve,
    transactions: () => transactions,
  };
};

const reassign = (conflictId: string, barberId: string) => ({
  conflictId,
  actorId: 'admin-1',
  decision: 'reassign' as const,
  barberId,
  date: '2026-11-24',
  start: '10:00',
  end: '10:30',
});

describe('ResolveShiftConflict', () => {
  it('one failure does not roll back the other visit decisions', async () => {
    const ctx = setup();

    const outcomes = await ctx.resolve.executeMany([
      reassign('c1', 'b2'),
      reassign('c2', 'b3'),
      { conflictId: 'c3', actorId: 'admin-1', decision: 'cancel' },
    ]);

    expect(outcomes.map((row) => row.status)).toEqual(['resolved', 'failed', 'resolved']);
    expect(ctx.transactions()).toBe(3);
    expect(ctx.rescheduled).toHaveLength(1);
    expect(ctx.cancelled).toEqual([
      expect.objectContaining({ appointmentId: 'appointment-c3', reason: 'barber unavailable' }),
    ]);
    expect(ctx.conflicts.rows.find((row) => row.id === 'c1')).toMatchObject({
      status: 'closed',
      resolution: 'reassigned',
      resolvedBarberId: 'b2',
    });
    expect(ctx.conflicts.rows.find((row) => row.id === 'c2')?.status).toBe('open');
    expect(ctx.conflicts.rows.find((row) => row.id === 'c3')).toMatchObject({
      status: 'closed',
      resolution: 'cancelled',
    });
    expect(ctx.events).toEqual(['rescheduled', 'cancelled']);
  });

  it('rejects a barber who does not perform the service', async () => {
    const ctx = setup();

    await expect(ctx.resolve.execute(reassign('c1', 'b3'))).rejects.toThrow(
      'Barber does not perform this service'
    );
    expect(ctx.conflicts.rows[0]?.status).toBe('open');
  });

  it('rejects reassigning into an unavailability interval', async () => {
    const ctx = setup({ unavailableBarbers: ['b2'] });

    await expect(ctx.resolve.execute(reassign('c1', 'b2'))).rejects.toThrow(
      'Barber is unavailable for this slot'
    );
    expect(ctx.rescheduled).toEqual([]);
    expect(ctx.conflicts.rows[0]?.status).toBe('open');
  });

  it('rejects reassigning to a barber on leave when day-off data is available', async () => {
    const ctx = setup({
      dayOffs: [
        {
          id: 'day-off-1',
          barberId: 'b2',
          from: '2026-11-24',
          to: '2026-11-24',
          reason: 'vacation',
        },
      ],
    });

    await expect(ctx.resolve.execute(reassign('c1', 'b2'))).rejects.toThrow(
      'Barber is on leave for this date'
    );
    expect(ctx.rescheduled).toEqual([]);
    expect(ctx.conflicts.rows[0]?.status).toBe('open');
  });

  it('repeating a closed conflict changes nothing and emits no second event', async () => {
    const ctx = setup();
    await ctx.resolve.execute(reassign('c1', 'b2'));
    const callsAfterFirst = ctx.rescheduled.length;
    const eventsAfterFirst = ctx.events.length;

    const replay = await ctx.resolve.execute(reassign('c1', 'b3'));

    expect(replay.changed).toBe(false);
    expect(ctx.rescheduled).toHaveLength(callsAfterFirst);
    expect(ctx.events).toHaveLength(eventsAfterFirst);
  });

  // T-4616b: одне рішення → один скасований візит → одна подія в outbox, тож
  // і одне повідомлення клієнту. Повтор не шле друге (replay закритий конфлікт).
  it('repeating a cancel decision does not cancel the visit twice', async () => {
    const ctx = setup();
    const cancel = { conflictId: 'c3', actorId: 'admin-1', decision: 'cancel' as const };

    await ctx.resolve.execute(cancel);
    const replay = await ctx.resolve.execute(cancel);

    expect(replay.changed).toBe(false);
    expect(replay.cancelledBookingIds).toBeUndefined();
    expect(ctx.cancelled).toHaveLength(1);
    expect(ctx.events).toEqual(['cancelled']);
  });

  it('treats a father-son party as one decision and never moves a single leg', async () => {
    const ctx = setup({
      partyBookings: { 'party-1': ['booking-father', 'booking-son'] },
    });

    await expect(ctx.resolve.execute(reassign('c4', 'b2'))).rejects.toThrow(
      'Party conflict must be resolved as a whole'
    );
    expect(ctx.rescheduled).toEqual([]);
    expect(ctx.cancelled).toEqual([]);
    expect(ctx.conflicts.rows.find((row) => row.id === 'c4')?.status).toBe('open');

    await ctx.resolve.execute({ conflictId: 'c4', actorId: 'admin-1', decision: 'cancel' });

    expect(ctx.cancelled).toEqual([
      expect.objectContaining({ appointmentId: 'booking-father', reason: 'barber unavailable' }),
      expect.objectContaining({ appointmentId: 'booking-son', reason: 'barber unavailable' }),
    ]);
    expect(ctx.conflicts.rows.find((row) => row.id === 'c4')).toMatchObject({
      partyId: 'party-1',
      status: 'closed',
      resolution: 'cancelled',
    });
  });
});
