// T-4542: use case повертає всі причини блокування одразу; guard кидає їх
// однією помилкою, а не перевіряє правило за правилом.
import { EvaluateOnlineBooking, OnlineBookingBlockedError } from './evaluate-online-booking';
import { DEFAULT_ONLINE_BOOKING_POLICY } from './online-booking-policy';
import { FakeStore } from './evaluate-online-booking.fakes';

const NOW = new Date('2026-11-17T10:00:00Z');
const at = (iso: string): Date => new Date(iso);

const build = (store: FakeStore): EvaluateOnlineBooking =>
  new EvaluateOnlineBooking({ store, clock: { now: () => NOW } });

describe('EvaluateOnlineBooking (T-4542)', () => {
  it('дозволяє запис у межах політики', async () => {
    const store = new FakeStore();
    const result = await build(store).execute({
      locationId: 'loc-1',
      action: 'create',
      start: at('2026-11-18T12:00:00Z'),
      clientId: 'client-1',
      barberId: 'barber-1',
    });
    expect(result.allowed).toBe(true);
    expect(result.blocks).toEqual([]);
    expect(result.policy).toEqual(DEFAULT_ONLINE_BOOKING_POLICY);
  });

  it('збирає кілька причин одразу: lead time, ліміт і дублікат', async () => {
    const store = new FakeStore();
    store.active = 2;
    store.duplicate = true;
    const result = await build(store).execute({
      locationId: 'loc-1',
      action: 'create',
      start: at('2026-11-17T10:20:00Z'),
      clientId: 'client-1',
      barberId: 'barber-1',
    });
    expect(result.allowed).toBe(false);
    expect(result.blocks.map((block) => block.code)).toEqual([
      'min_lead_time',
      'max_active_bookings',
      'duplicate_booking',
    ]);
  });

  it('бере політику локації замість дефолту', async () => {
    const store = new FakeStore();
    store.policy = { locationId: 'loc-1', minLeadMinutes: 5, maxActiveBookings: 5 };
    store.active = 2;
    const result = await build(store).execute({
      locationId: 'loc-1',
      action: 'create',
      start: at('2026-11-17T10:10:00Z'),
      clientId: 'client-1',
    });
    expect(result.allowed).toBe(true);
    expect(result.policy.minLeadMinutes).toBe(5);
  });

  it('скасування блокується лише дедлайном', async () => {
    const store = new FakeStore();
    const evaluate = build(store);
    const late = await evaluate.execute({
      locationId: 'loc-1',
      action: 'cancel',
      start: at('2026-11-17T12:00:00Z'),
      clientId: 'client-1',
    });
    expect(late.blocks.map((block) => block.code)).toEqual(['cancellation_deadline']);
    const early = await evaluate.execute({
      locationId: 'loc-1',
      action: 'cancel',
      start: at('2026-11-20T12:00:00Z'),
      clientId: 'client-1',
    });
    expect(early.allowed).toBe(true);
  });

  it('перенесення має власний дедлайн', async () => {
    const result = await build(new FakeStore()).execute({
      locationId: 'loc-1',
      action: 'reschedule',
      start: at('2026-11-17T13:00:00Z'),
      clientId: 'client-1',
    });
    expect(result.blocks.map((block) => block.code)).toEqual(['reschedule_deadline']);
  });

  it('guard кидає OnlineBookingBlockedError з усіма причинами', async () => {
    const store = new FakeStore();
    store.noShows = 3;
    const result = await build(store).execute({
      locationId: 'loc-1',
      action: 'create',
      start: at('2026-11-18T12:00:00Z'),
      clientId: 'client-1',
    });
    expect(result.allowed).toBe(false);
    const error = new OnlineBookingBlockedError(result.blocks);
    expect(error.blocks).toHaveLength(1);
    expect(error.message).toBe('no_show_block');
  });
});
