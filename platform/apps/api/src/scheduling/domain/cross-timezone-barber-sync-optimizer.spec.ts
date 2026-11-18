import { evaluateCrossTimezoneBarberSync, TimezoneSlotRequest, BarberExistingAssignment } from './cross-timezone-barber-sync-optimizer';

describe('CrossTimezoneBarberSyncOptimizer', () => {
  const baseDate = new Date('2026-11-15T10:00:00Z');

  it('should successfully synchronize a non-overlapping slot request across timezones', () => {
    const request: TimezoneSlotRequest = {
      slotId: 'slot-100',
      barberId: 'barber-alex',
      clientId: 'client-john',
      clientTimezone: 'America/New_York',
      salonTimezone: 'Europe/Kyiv',
      startUtc: baseDate,
      durationMinutes: 45,
      sanitationBufferMinutes: 10,
    };

    const existingAssignments: BarberExistingAssignment[] = [
      {
        barberId: 'barber-alex',
        startUtc: new Date('2026-11-15T08:00:00Z'),
        endUtc: new Date('2026-11-15T09:00:00Z'),
      },
    ];

    const result = evaluateCrossTimezoneBarberSync(request, existingAssignments);

    expect(result.isSynchronized).toBe(true);
    expect(result.normalizedStartUtc).toEqual(baseDate);
    expect(result.requiredBufferMinutes).toBe(10);
    expect(result.reason).toContain('successfully synchronized');
  });

  it('should detect conflict when requested slot overlaps with existing barber appointment', () => {
    const request: TimezoneSlotRequest = {
      slotId: 'slot-101',
      barberId: 'barber-alex',
      clientId: 'client-jane',
      clientTimezone: 'Europe/London',
      salonTimezone: 'Europe/Kyiv',
      startUtc: new Date('2026-11-15T10:30:00Z'),
      durationMinutes: 45,
      sanitationBufferMinutes: 10,
    };

    const existingAssignments: BarberExistingAssignment[] = [
      {
        barberId: 'barber-alex',
        startUtc: new Date('2026-11-15T10:00:00Z'),
        endUtc: new Date('2026-11-15T11:15:00Z'),
      },
    ];

    const result = evaluateCrossTimezoneBarberSync(request, existingAssignments);

    expect(result.isSynchronized).toBe(false);
    expect(result.conflictBarberId).toBe('barber-alex');
    expect(result.reason).toContain('overlapping appointment');
  });

  it('should reject request when timezone drift exceeds max allowed limit', () => {
    const request: TimezoneSlotRequest = {
      slotId: 'slot-103',
      barberId: 'barber-alex',
      clientId: 'client-mike',
      clientTimezone: 'America/New_York',
      salonTimezone: 'Europe/Kyiv',
      startUtc: baseDate,
      durationMinutes: 45,
      sanitationBufferMinutes: 10,
    };

    const result = evaluateCrossTimezoneBarberSync(request, [], {
      maxAllowedTimezoneDriftMinutes: 5, // very strict limit for test
      defaultBufferMinutes: 10,
      dstSafetyMarginMinutes: 15,
    });

    expect(result.isSynchronized).toBe(false);
    expect(result.reason).toContain('Timezone drift');
  });

  it('should detect DST transition and apply safety margin buffer adjustment', () => {
    const request: TimezoneSlotRequest = {
      slotId: 'slot-dst',
      barberId: 'barber-alex',
      clientId: 'client-olga',
      clientTimezone: 'America/New_York',
      salonTimezone: 'America/New_York',
      startUtc: new Date('2026-11-01T05:30:00Z'), // crosses America/New_York fall-back DST transition
      durationMinutes: 120,
      sanitationBufferMinutes: 10,
    };

    const result = evaluateCrossTimezoneBarberSync(request, [], {
      maxAllowedTimezoneDriftMinutes: 1440,
      defaultBufferMinutes: 10,
      dstSafetyMarginMinutes: 15,
    });

    expect(result.isSynchronized).toBe(true);
    expect(result.requiredBufferMinutes).toBe(10);
    expect(result.dstTransitionDetected).toBe(true);
    expect(result.dstAdjustedBufferMinutes).toBe(25); // 10 + 15 safety margin
    expect(result.reason).toContain('DST transition detected');
  });
});
