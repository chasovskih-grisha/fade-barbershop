import { sortWaitlistEntries } from '../engine';
import { WaitlistEntry, WaitlistStatus } from '../types';

describe('Waitlist sorting', () => {
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
        priorityScore: 50,
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
        createdAt: '2026-11-10T08:00:00Z',
      },
    ];

    const sorted = sortWaitlistEntries(entries);
    expect(sorted[0]?.id).toBe('e2');
    expect(sorted[1]?.id).toBe('e3');
    expect(sorted[2]?.id).toBe('e1');
  });
});
