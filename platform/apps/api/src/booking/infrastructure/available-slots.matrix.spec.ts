// Matrix filter (T-4521): candidates are restricted to barbers assigned the
// service; an empty matrix falls back to all active barbers.
import { makeSlots, SLOT_REQUEST } from './available-slots.fakes';

const b1Only = new Map<string, Map<string, Set<string>>>([
  ['b1', new Map([['loc-1', new Set(['service-1'])]])],
]);

describe('AvailableSlots barber x service matrix (T-4521)', () => {
  it('any-barber slots list only barbers of the service', async () => {
    const slots = await makeSlots({ matrix: b1Only }).handle(SLOT_REQUEST);
    expect(slots.find((s) => s.start === '09:00')?.barbers).toEqual(['b1']);
  });

  it('empty matrix falls back to all active barbers', async () => {
    const slots = await makeSlots().handle(SLOT_REQUEST);
    const barbers = slots.find((s) => s.start === '09:00')?.barbers ?? [];
    expect([...barbers].sort()).toEqual(['b1', 'b2']);
  });

  it('an explicitly selected barber without the service sees disabled slots', async () => {
    const slots = await makeSlots({ matrix: b1Only }).handle({
      ...SLOT_REQUEST,
      barberId: 'b2',
    });
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every((s) => s.barbers.length === 0)).toBe(true);
  });

  it('an explicitly selected barber with the service keeps his slots', async () => {
    const slots = await makeSlots({ matrix: b1Only }).handle({
      ...SLOT_REQUEST,
      barberId: 'b1',
    });
    expect(slots.find((s) => s.start === '09:00')?.barbers).toEqual(['b1']);
  });
});
