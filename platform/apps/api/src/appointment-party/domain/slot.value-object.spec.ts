import { Slot } from './slot.value-object';

describe('Slot', () => {
  it('creates a valid slot and computes durationMinutes', () => {
    const slot = Slot.create(new Date('2026-10-01T09:00:00Z'), new Date('2026-10-01T10:30:00Z'));
    expect(slot.start.toISOString()).toBe('2026-10-01T09:00:00.000Z');
    expect(slot.end.toISOString()).toBe('2026-10-01T10:30:00.000Z');
    expect(slot.durationMinutes).toBe(90);
  });

  it('rejects an end at or before the start', () => {
    expect(() =>
      Slot.create(new Date('2026-10-01T09:00:00Z'), new Date('2026-10-01T09:00:00Z'))
    ).toThrow('Slot end must be after start');
    expect(() =>
      Slot.create(new Date('2026-10-01T10:00:00Z'), new Date('2026-10-01T09:00:00Z'))
    ).toThrow('Slot end must be after start');
  });

  it('supports sub-hour durations', () => {
    const slot = Slot.create(new Date('2026-10-01T09:00:00Z'), new Date('2026-10-01T09:45:00Z'));
    expect(slot.durationMinutes).toBe(45);
  });
});
