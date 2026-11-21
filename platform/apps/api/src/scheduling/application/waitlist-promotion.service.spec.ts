/* eslint-disable max-lines -- cohesive module (145 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
import { WaitlistPromotionService, WaitlistEntry } from './waitlist-promotion.service';

describe('WaitlistPromotionService (Waitlist Auto-Promotion & Slot Recovery)', () => {
  let service: WaitlistPromotionService;
  const now = new Date('2026-11-10T12:00:00Z');

  beforeEach(() => {
    service = new WaitlistPromotionService();
  });

  it('computes priority score factoring VIP, waiting time, and no-show penalty', () => {
    const entry: WaitlistEntry = {
      id: 'w-1',
      clientId: 'c-1',
      locationId: 'loc-1',
      barberId: 'b-1',
      serviceId: 's-1',
      desiredStart: '2026-11-10T14:00:00Z',
      desiredEnd: '2026-11-10T15:00:00Z',
      status: 'WAITING',
      waitingSince: new Date('2026-11-10T10:00:00Z'), // 2 hours waiting
      vipLevel: 1, // +100
      noShowCount90d: 1, // -50
    };

    // 2 hours + 100 (VIP) - 50 (1 no-show * 50) = 52
    const score = service.computePriority(entry, now);
    expect(score).toBe(52);
  });

  it('promotes highest priority candidate upon slot recovery and sets holdExpiresAt', () => {
    const entries: WaitlistEntry[] = [
      {
        id: 'w-1',
        clientId: 'c-1',
        locationId: 'loc-1',
        barberId: 'b-1',
        serviceId: 's-1',
        desiredStart: '2026-11-10T14:00:00Z',
        desiredEnd: '2026-11-10T15:00:00Z',
        status: 'WAITING',
        waitingSince: new Date('2026-11-10T11:00:00Z'), // 1 hour waiting
        vipLevel: 0,
        noShowCount90d: 0,
      },
      {
        id: 'w-2',
        clientId: 'c-2',
        locationId: 'loc-1',
        barberId: 'b-1',
        serviceId: 's-1',
        desiredStart: '2026-11-10T14:00:00Z',
        desiredEnd: '2026-11-10T15:00:00Z',
        status: 'WAITING',
        waitingSince: new Date('2026-11-10T08:00:00Z'), // 4 hours waiting
        vipLevel: 1, // VIP! Higher priority
        noShowCount90d: 0,
      },
    ];

    const { updatedEntries, result } = service.processSlotRecovery(
      {
        locationId: 'loc-1',
        barberId: 'b-1',
        start: '2026-11-10T14:00:00Z',
        end: '2026-11-10T15:00:00Z',
      },
      entries,
      now,
      30
    );

    expect(result.promotedEntryId).toBe('w-2');
    expect(result.offeredClientId).toBe('c-2');
    expect(result.expiresAt).toEqual(new Date('2026-11-10T12:30:00Z'));

    const promoted = updatedEntries.find((e) => e.id === 'w-2');
    expect(promoted?.status).toBe('OFFERED');
    expect(promoted?.holdExpiresAt).toEqual(new Date('2026-11-10T12:30:00Z'));

    const unpromoted = updatedEntries.find((e) => e.id === 'w-1');
    expect(unpromoted?.status).toBe('WAITING');
  });

  it('returns no promotion result if no waiting entries match location or barber', () => {
    const entries: WaitlistEntry[] = [
      {
        id: 'w-1',
        clientId: 'c-1',
        locationId: 'loc-2', // Different location
        barberId: 'b-1',
        serviceId: 's-1',
        desiredStart: '2026-11-10T14:00:00Z',
        desiredEnd: '2026-11-10T15:00:00Z',
        status: 'WAITING',
        waitingSince: new Date('2026-11-10T10:00:00Z'),
        vipLevel: 0,
        noShowCount90d: 0,
      },
    ];

    const { updatedEntries, result } = service.processSlotRecovery(
      {
        locationId: 'loc-1',
        barberId: 'b-1',
        start: '2026-11-10T14:00:00Z',
        end: '2026-11-10T15:00:00Z',
      },
      entries,
      now
    );

    expect(result.promotedEntryId).toBeUndefined();
    expect(updatedEntries).toEqual(entries);
  });

  it('evaluates hold expiration and marks expired offered entries as EXPIRED', () => {
    const entries: WaitlistEntry[] = [
      {
        id: 'w-1',
        clientId: 'c-1',
        locationId: 'loc-1',
        barberId: 'b-1',
        serviceId: 's-1',
        desiredStart: '2026-11-10T14:00:00Z',
        desiredEnd: '2026-11-10T15:00:00Z',
        status: 'OFFERED',
        waitingSince: new Date('2026-11-10T10:00:00Z'),
        vipLevel: 0,
        noShowCount90d: 0,
        holdExpiresAt: new Date('2026-11-10T11:30:00Z'), // expired relative to 'now' (12:00:00Z)
      },
      {
        id: 'w-2',
        clientId: 'c-2',
        locationId: 'loc-1',
        barberId: 'b-1',
        serviceId: 's-1',
        desiredStart: '2026-11-10T14:00:00Z',
        desiredEnd: '2026-11-10T15:00:00Z',
        status: 'OFFERED',
        waitingSince: new Date('2026-11-10T10:00:00Z'),
        vipLevel: 0,
        noShowCount90d: 0,
        holdExpiresAt: new Date('2026-11-10T13:00:00Z'), // still active
      },
    ];

    const evaluated = service.evaluateHoldExpiration(entries, now);
    expect(evaluated[0]?.status).toBe('EXPIRED');
    expect(evaluated[1]?.status).toBe('OFFERED');
  });

  it('calculates optimal reminder timing relative to appointment start', () => {
    const appointmentStart = new Date('2026-11-15T14:00:00Z');
    const schedule = service.calculateOptimalReminderTiming(appointmentStart);

    expect(schedule.freeCancellationReminderAt).toEqual(new Date('2026-11-14T14:00:00Z'));
    expect(schedule.lateCancellationWarningAt).toEqual(new Date('2026-11-15T10:00:00Z'));
    expect(schedule.arrivalCheckInAt).toEqual(new Date('2026-11-15T13:30:00Z'));
  });
});
