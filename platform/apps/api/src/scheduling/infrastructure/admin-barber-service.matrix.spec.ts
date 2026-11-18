// Admin matrix IO listings (T-4521): barber -> services and service -> barbers
// for one location. Split from admin-barber-service.io.spec.ts (gate max-lines).
import { listForBarberAndLocation, listForServiceAndLocation } from './admin-barber-service.io';

describe('admin matrix IO (T-4521)', () => {
  const matrix = new Map<string, Map<string, Set<string>>>([
    ['b1', new Map([['loc-1', new Set(['svc-1', 'svc-2'])]])],
    ['b2', new Map([['loc-1', new Set(['svc-1'])]])],
    ['b3', new Map([['loc-2', new Set(['svc-1'])]])],
  ]);
  const repo = {
    snapshotForLocation: async () => ({ matrix }),
    setAssignment: jest.fn(async () => undefined),
  } as never;

  it('lists services of one barber in one location', async () => {
    const list = listForBarberAndLocation(repo);
    await expect(list('b1', 'loc-1')).resolves.toEqual({
      barberId: 'b1',
      locationId: 'loc-1',
      services: [
        { serviceId: 'svc-1', active: true },
        { serviceId: 'svc-2', active: true },
      ],
    });
  });

  it('lists barbers of one service in one location', async () => {
    const list = listForServiceAndLocation(repo);
    await expect(list('loc-1', 'svc-1')).resolves.toEqual({
      locationId: 'loc-1',
      serviceId: 'svc-1',
      barbers: [
        { barberId: 'b1', active: true },
        { barberId: 'b2', active: true },
      ],
    });
  });
});
