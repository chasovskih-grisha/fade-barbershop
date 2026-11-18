import { toMinutes, minutesToTime, getZonedOffsetMinutes, isDstTransitionSafe } from './time-utils';

describe('time-utils (Booking Engine Optimization Specialist)', () => {
  it('parses an "HH:MM" string into minutes since midnight', () => {
    expect(toMinutes('00:00')).toBe(0);
    expect(toMinutes('09:15')).toBe(555);
    expect(toMinutes('23:59')).toBe(1439);
  });

  it('treats a missing minute part as zero', () => {
    expect(toMinutes('9')).toBe(540);
  });

  it('round-trips a value in each period of the day', () => {
    expect(minutesToTime(0)).toBe('00:00');
    expect(minutesToTime(555)).toBe('09:15');
    expect(minutesToTime(1439)).toBe('23:59');
  });

  it('calculates zoned offset minutes for Europe/Kyiv', () => {
    const d = new Date('2026-06-15T12:00:00Z'); // Summer offset +3h = 180 min
    const offset = getZonedOffsetMinutes(d, 'Europe/Kyiv');
    expect(offset).toBe(180);
  });

  it('validates DST transition safety within same offset period', () => {
    const start = new Date('2026-06-15T10:00:00Z');
    const end = new Date('2026-06-15T11:00:00Z');
    expect(isDstTransitionSafe(start, end, 'Europe/Kyiv')).toBe(true);
  });

  it('detects DST transition when interval crosses fall-back boundary in America/New_York', () => {
    const start = new Date('2026-11-01T05:30:00Z');
    const end = new Date('2026-11-01T07:30:00Z');
    expect(isDstTransitionSafe(start, end, 'America/New_York')).toBe(false);
  });
});
