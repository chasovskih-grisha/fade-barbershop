// Slot policy consumption (T-4522): step grid, buffer trimming, horizon window
// and last-minute cutoff in slot generation. Fakes - in available-slots.fakes.ts.
import { Booking } from '../../scheduling/domain/booking';
import { makeSlots, SLOT_REQUEST } from './available-slots.fakes';
import { readSlotPolicySnapshot } from './available-slots.policy';

describe('AvailableSlots slot policy (T-4522)', () => {
  it('falls back to Europe/Kyiv for invalid timezones in policy', () => {
    const snapshot = readSlotPolicySnapshot({
      id: 'p1',
      locationId: 'l1',
      stepMinutes: 15,
      bufferMinutes: 0,
      horizonDays: 14,
      lastMinuteMinutes: 60,
      timeZone: 'Invalid/Timezone',
    });
    expect(snapshot.timeZone).toBe('Europe/Kyiv');
  });
  it('uses the policy step for the grid (30 min -> every 30 min)', async () => {
    const slots = await makeSlots({ policy: { stepMinutes: 30 } }).handle(SLOT_REQUEST);
    const starts = slots.map((s) => s.start);
    expect(starts).toContain('09:00');
    expect(starts).toContain('09:30');
    expect(starts).not.toContain('09:15');
  });

  it('default grid is 15 minutes without a policy row', async () => {
    const starts = (await makeSlots().handle(SLOT_REQUEST)).map((s) => s.start);
    expect(starts).toContain('09:15');
  });

  it('buffer trims slots starting inside the buffer after a booking', async () => {
    // prettier-ignore
    const booking = Booking.create({ barberId: 'b1', locationId: 'loc-1', start: new Date('2026-10-05T09:00:00.000Z'), end: new Date('2026-10-05T10:00:00.000Z') });
    const free = await makeSlots({ bookings: [booking] }).handle(SLOT_REQUEST);
    expect(free.find((s) => s.start === '10:00')?.barbers).toContain('b1');
    const buffered = await makeSlots({
      bookings: [booking],
      policy: { bufferMinutes: 15 },
    }).handle(SLOT_REQUEST);
    expect(buffered.find((s) => s.start === '10:00')?.barbers).toEqual(['b2']);
    expect(buffered.find((s) => s.start === '10:15')?.barbers).toContain('b1');
  });

  it('rejects dates beyond the horizon window', async () => {
    expect(await makeSlots().handle({ ...SLOT_REQUEST, date: '2026-10-19' })).toEqual([]);
    const within = await makeSlots().handle({ ...SLOT_REQUEST, date: '2026-10-12' });
    expect(within.length).toBeGreaterThan(0);
  });

  it('closes slots inside the last-minute cutoff; past dates keep legacy behavior', async () => {
    const now = '2026-10-05T09:30:00.000Z';
    const today = await makeSlots({ now }).handle(SLOT_REQUEST);
    expect(today.find((s) => s.start === '09:15')?.barbers).toEqual([]);
    expect(today.find((s) => s.start === '10:00')?.barbers).toEqual([]);
    expect(today.find((s) => s.start === '10:30')?.barbers).toContain('b1');
    const past = await makeSlots({ now }).handle({ ...SLOT_REQUEST, date: '2026-09-28' });
    expect(past.find((s) => s.start === '09:15')?.barbers).toContain('b1');
  });
});
