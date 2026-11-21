import { checkWaitlistAutoPause } from '../engine';
import { WaitlistEntry, WaitlistStatus } from '../types';

describe('Waitlist auto-pause', () => {
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
    expect(result.updatedEntries.find((entry) => entry.id === 'e4')?.status).toBe(
      WaitlistStatus.PAUSED
    );
  });
});
