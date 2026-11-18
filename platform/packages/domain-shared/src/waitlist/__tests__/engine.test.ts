import { sortWaitlistEntries, processWaitlistCascade, checkWaitlistAutoPause } from '../engine';
import { WaitlistEntry, WaitlistStatus, SoftHoldConfig, SlotRecoveryEvent } from '../types';

describe('Waitlist Auto-Promotion & Slot Recovery Engine', () => {
  const config: SoftHoldConfig = {
    holdDurationMinutes: 30,
  };

  const recoveryEvent: SlotRecoveryEvent = {
    slotTime: '2026-11-10T15:00:00Z',
    locationId: 'loc-1',
    serviceId: 'srv-haircut',
  };

  test('sorts entries by priority score descending then FIFO createdAt', () => {
    const entries: WaitlistEntry[] = [
      {
        id: 'e1',
        clientId: 'c1',
        locationId: 'loc-1',
        serviceId: 'srv-haircut',
        preferredDate: '2026-11-10',
        priorityScore: 10,
        status: WaitlistStatus.PENDING,
        createdAt: '2026-11-10T10:00:00Z',
      },
      {
        id: 'e2',
        clientId: 'c2',
        locationId: 'loc-1',
        serviceId: 'srv-haircut',
        preferredDate: '2026-11-10',
        priorityScore: 50, // higher priority
        status: WaitlistStatus.PENDING,
        createdAt: '2026-11-10T09:00:00Z',
      },
      {
        id: 'e3',
        clientId: 'c3',
        locationId: 'loc-1',
        serviceId: 'srv-haircut',
        preferredDate: '2026-11-10',
        priorityScore: 10,
        status: WaitlistStatus.PENDING,
        createdAt: '2026-11-10T08:00:00Z', // earlier FIFO among score 10
      },
    ];

    const sorted = sortWaitlistEntries(entries);
    expect(sorted[0]?.id).toBe('e2'); // highest score
    expect(sorted[1]?.id).toBe('e3'); // score 10, earlier createdAt
    expect(sorted[2]?.id).toBe('e1'); // score 10, later createdAt
  });

  test('promotes highest priority pending candidate on slot recovery with soft hold', () => {
    const now = new Date('2026-11-10T12:00:00Z');
    const entries: WaitlistEntry[] = [
      {
        id: 'e1',
        clientId: 'c1',
        locationId: 'loc-1',
        serviceId: 'srv-haircut',
        preferredDate: '2026-11-10',
        priorityScore: 20,
        status: WaitlistStatus.PENDING,
        createdAt: '2026-11-10T10:00:00Z',
      },
    ];

    const result = processWaitlistCascade(entries, recoveryEvent, config, now);
    expect(result.offeredEntry).toBeDefined();
    expect(result.offeredEntry?.id).toBe('e1');
    expect(result.offeredEntry?.status).toBe(WaitlistStatus.OFFERED);
    expect(result.offeredEntry?.softHoldExpiresAt).toContain('2026-11-10T12:30:00');
  });

  test('expires old soft holds and cascades to next candidate', () => {
    const now = new Date('2026-11-10T13:00:00Z');
    const entries: WaitlistEntry[] = [
      {
        id: 'e1',
        clientId: 'c1',
        locationId: 'loc-1',
        serviceId: 'srv-haircut',
        preferredDate: '2026-11-10',
        priorityScore: 20,
        status: WaitlistStatus.OFFERED,
        createdAt: '2026-11-10T10:00:00Z',
        softHoldExpiresAt: '2026-11-10T12:30:00.000Z', // Expired at 12:30
      },
      {
        id: 'e2',
        clientId: 'c2',
        locationId: 'loc-1',
        serviceId: 'srv-haircut',
        preferredDate: '2026-11-10',
        priorityScore: 10,
        status: WaitlistStatus.PENDING,
        createdAt: '2026-11-10T10:30:00Z',
      },
    ];

    const result = processWaitlistCascade(entries, recoveryEvent, config, now);
    const expiredE1 = result.updatedEntries.find(e => e.id === 'e1');
    expect(expiredE1?.status).toBe(WaitlistStatus.EXPIRED);

    expect(result.offeredEntry?.id).toBe('e2');
    expect(result.offeredEntry?.status).toBe(WaitlistStatus.OFFERED);
    expect(result.offeredEntry?.softHoldExpiresAt).toContain('2026-11-10T13:30:00');
  });

  test('auto-pauses client waitlist requests after 3 consecutive expired offers', () => {
    const entries: WaitlistEntry[] = [
      {
        id: 'e1',
        clientId: 'c1',
        locationId: 'loc-1',
        serviceId: 'srv-haircut',
        preferredDate: '2026-11-10',
        priorityScore: 10,
        status: WaitlistStatus.EXPIRED,
        createdAt: '2026-11-10T08:00:00Z',
      },
      {
        id: 'e2',
        clientId: 'c1',
        locationId: 'loc-1',
        serviceId: 'srv-haircut',
        preferredDate: '2026-11-11',
        priorityScore: 10,
        status: WaitlistStatus.EXPIRED,
        createdAt: '2026-11-10T09:00:00Z',
      },
      {
        id: 'e3',
        clientId: 'c1',
        locationId: 'loc-1',
        serviceId: 'srv-haircut',
        preferredDate: '2026-11-12',
        priorityScore: 10,
        status: WaitlistStatus.EXPIRED,
        createdAt: '2026-11-10T10:00:00Z',
      },
      {
        id: 'e4',
        clientId: 'c1',
        locationId: 'loc-1',
        serviceId: 'srv-haircut',
        preferredDate: '2026-11-13',
        priorityScore: 10,
        status: WaitlistStatus.PENDING,
        createdAt: '2026-11-10T11:00:00Z',
      },
    ];

    const result = checkWaitlistAutoPause(entries, 'c1', 3);
    expect(result.isPaused).toBe(true);
    expect(result.missedCount).toBe(3);
    const pendingE4 = result.updatedEntries.find(e => e.id === 'e4');
    expect(pendingE4?.status).toBe(WaitlistStatus.PAUSED);
  });
});
