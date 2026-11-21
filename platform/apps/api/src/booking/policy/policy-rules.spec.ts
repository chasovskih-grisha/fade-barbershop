// T-4542: правила онлайн-букінгу — межі, дедлайни, ліміти й тексти для фронту.
import { DEFAULT_ONLINE_BOOKING_POLICY, isValidPolicy, mergePolicy } from './online-booking-policy';
import {
  checkActiveBookings,
  checkCancellationDeadline,
  checkDuplicate,
  checkGuestBooking,
  checkHorizon,
  checkLeadTime,
  checkNoShowBlock,
  checkRescheduleDeadline,
} from './policy-rules';

const NOW = new Date('2026-11-17T10:00:00Z');
const policy = DEFAULT_ONLINE_BOOKING_POLICY;
const at = (iso: string): Date => new Date(iso);

describe('online booking policy (T-4542)', () => {
  it('дефолти: 60 хв lead time, 30 днів горизонту, 2 активні записи', () => {
    expect(policy).toMatchObject({ minLeadMinutes: 60, maxHorizonDays: 30, maxActiveBookings: 2 });
    expect(isValidPolicy(policy)).toBe(true);
  });

  it('mergePolicy заповнює пропуски дефолтами і зберігає перевизначення', () => {
    const merged = mergePolicy({ minLeadMinutes: 30, maxActiveBookings: 3 });
    expect(merged.minLeadMinutes).toBe(30);
    expect(merged.maxActiveBookings).toBe(3);
    expect(merged.cancellationDeadlineHours).toBe(policy.cancellationDeadlineHours);
    expect(mergePolicy(null)).toEqual(DEFAULT_ONLINE_BOOKING_POLICY);
  });

  it('lead time: 30 хв до старту — блок, 90 хв — дозвіл', () => {
    expect(checkLeadTime(policy, at('2026-11-17T10:29:00Z'), NOW)?.code).toBe('min_lead_time');
    expect(checkLeadTime(policy, at('2026-11-17T11:30:00Z'), NOW)).toBeNull();
  });

  it('горизонт: 31 день — блок, 29 днів — дозвіл', () => {
    expect(checkHorizon(policy, at('2026-12-18T10:00:00Z'), NOW)?.code).toBe('horizon');
    expect(checkHorizon(policy, at('2026-12-16T10:00:00Z'), NOW)).toBeNull();
  });

  it('дедлайни скасування й перенесення рахуються в годинах', () => {
    expect(checkCancellationDeadline(policy, at('2026-11-17T21:00:00Z'), NOW)?.code).toBe(
      'cancellation_deadline'
    );
    expect(checkCancellationDeadline(policy, at('2026-11-18T00:00:00Z'), NOW)).toBeNull();
    expect(checkRescheduleDeadline(policy, at('2026-11-17T21:00:00Z'), NOW)?.code).toBe(
      'reschedule_deadline'
    );
  });

  it('ліміт активних записів і дублікат дають свої причини', () => {
    expect(checkActiveBookings(policy, 2)?.code).toBe('max_active_bookings');
    expect(checkActiveBookings(policy, 1)).toBeNull();
    expect(checkDuplicate(true)?.code).toBe('duplicate_booking');
    expect(checkDuplicate(false)).toBeNull();
  });

  it('no-show блокує від 3 випадків; 0 вимикає правило', () => {
    expect(checkNoShowBlock(policy, 3)?.code).toBe('no_show_block');
    expect(checkNoShowBlock(policy, 2)).toBeNull();
    expect(
      checkNoShowBlock({ ...policy, noShowBlock: { count: 0, windowDays: 180 } }, 9)
    ).toBeNull();
  });

  it('guest booking залежить від перемикача й наявності акаунта', () => {
    expect(checkGuestBooking(policy, false)).toBeNull();
    const closed = { ...policy, allowGuestBooking: false };
    expect(checkGuestBooking(closed, false)?.code).toBe('guest_booking_disabled');
    expect(checkGuestBooking(closed, true)).toBeNull();
  });

  it('повідомлення містять числові межі, щоб UI не дублював формулювання', () => {
    expect(checkLeadTime(policy, at('2026-11-17T10:10:00Z'), NOW)?.message).toContain('60');
    expect(checkActiveBookings(policy, 5)?.message).toContain('2');
  });
});
