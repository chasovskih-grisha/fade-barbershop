import { BookingEngine, BookingRequest } from '../src/index';

describe('BookingEngine', () => {
  let engine: BookingEngine;

  beforeEach(() => {
    engine = new BookingEngine('UTC', 24);
  });

  test('slot locking and concurrency handling', () => {
    const slotKey = 'barber-1_2026-11-20T10:00:00Z';
    const locked1 = engine.lockSlot(slotKey, 'client-A', 5000);
    expect(locked1).toBe(true);

    // Another client trying to lock same slot should fail
    const locked2 = engine.lockSlot(slotKey, 'client-B', 5000);
    expect(locked2).toBe(false);

    // Same client refreshing lock should succeed
    const lockedRefresh = engine.lockSlot(slotKey, 'client-A', 5000);
    expect(lockedRefresh).toBe(true);

    // Release slot
    const released = engine.releaseSlot(slotKey, 'client-A');
    expect(released).toBe(true);

    // Now client-B can lock
    const locked3 = engine.lockSlot(slotKey, 'client-B', 5000);
    expect(locked3).toBe(true);
  });

  test('appointment scheduling and overlap prevention', () => {
    const req1: BookingRequest = {
      barberId: 'barber-1',
      serviceId: 'fade-cut',
      startTime: '2026-11-20T10:00:00Z',
      durationMinutes: 30,
    };

    const res1 = engine.bookAppointment(req1, 'client-A');
    expect(res1.success).toBe(true);

    // Overlapping request (starts during req1)
    const reqOverlap: BookingRequest = {
      barberId: 'barber-1',
      serviceId: 'beard-trim',
      startTime: '2026-11-20T10:15:00Z',
      durationMinutes: 30,
    };
    const resOverlap = engine.bookAppointment(reqOverlap, 'client-B');
    expect(resOverlap.success).toBe(false);
    expect(resOverlap.error).toContain('overlaps');

    // Non-overlapping request for same barber later
    const reqLater: BookingRequest = {
      barberId: 'barber-1',
      serviceId: 'fade-cut',
      startTime: '2026-11-20T10:30:00Z',
      durationMinutes: 30,
    };
    const resLater = engine.bookAppointment(reqLater, 'client-C');
    expect(resLater.success).toBe(true);
  });

  test('timezone conversion correctly maps client local time to shop UTC', () => {
    // Client in EST (-300 minutes from UTC) booking 10:00 AM local
    const clientTime = '2026-11-20T10:00:00';
    const utcTime = engine.convertClientTimeToShopUTC(clientTime, -300);
    expect(utcTime).toBe('2026-11-20T15:00:00.000Z');
  });

  test('cancellation policy enforces window and fee applicability', () => {
    const apptTime = '2026-11-21T10:00:00Z';
    
    // Cancellation 48 hours before (outside 24h window) -> allowed, no fee
    const check1 = engine.canCancelAppointment(apptTime, '2026-11-19T10:00:00Z');
    expect(check1.allowed).toBe(true);
    expect(check1.feeApplicable).toBe(false);

    // Cancellation 2 hours before (within 24h window) -> allowed, fee applicable (late cancellation)
    const check2 = engine.canCancelAppointment(apptTime, '2026-11-21T08:00:00Z');
    expect(check2.allowed).toBe(true);
    expect(check2.feeApplicable).toBe(true);
  });
});
