import { processWaitlistCascade } from '../engine';
import { WaitlistEntry, WaitlistStatus, SoftHoldConfig, SlotRecoveryEvent } from '../types';

describe('Waitlist slot recovery cascade', () => {
  const config: SoftHoldConfig = { holdDurationMinutes: 30 };
  const recoveryEvent: SlotRecoveryEvent = {
    slotTime: '2026-11-10T15:00:00Z',
    locationId: 'loc-1',
    serviceId: 'srv-haircut',
  };

  test('promotes highest priority pending candidate on slot recovery with soft hold', () => {
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

    const result = processWaitlistCascade({
      entries,
      recoveryEvent,
      config,
      now: new Date('2026-11-10T12:00:00Z'),
    });
    expect(result.offeredEntry?.id).toBe('e1');
    expect(result.offeredEntry?.status).toBe(WaitlistStatus.OFFERED);
    expect(result.offeredEntry?.softHoldExpiresAt).toContain('2026-11-10T12:30:00');
  });

  test('expires old soft holds and cascades to next candidate', () => {
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
        softHoldExpiresAt: '2026-11-10T12:30:00.000Z',
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

    const result = processWaitlistCascade({
      entries,
      recoveryEvent,
      config,
      now: new Date('2026-11-10T13:00:00Z'),
    });
    expect(result.updatedEntries.find((entry) => entry.id === 'e1')?.status).toBe(
      WaitlistStatus.EXPIRED
    );
    expect(result.offeredEntry?.id).toBe('e2');
    expect(result.offeredEntry?.softHoldExpiresAt).toContain('2026-11-10T13:30:00');
  });
});
