import { EdgeGateway } from './gateway';
import { GraphqlContract } from './graphql-contract';
import type { Selection } from './gateway.types';

const booking = {
  id: 'booking-1',
  status: 'confirmed',
  start: '2026-11-22T10:00:00Z',
  client: { id: 'client-1', firstName: 'Ada' },
};

function gateway(now: () => number, budget = 50): EdgeGateway {
  return new EdgeGateway({ contract: new GraphqlContract(), latencyBudgetMs: budget, now });
}

const selection: readonly Selection[] = [
  { field: 'id' },
  { field: 'client', children: [{ field: 'firstName' }] },
];

describe('EdgeGateway.query (T-5003)', () => {
  it('validates, resolves and projects the requested payload', async () => {
    const times = [1_000, 1_012];
    const result = await gateway(() => times.shift() ?? 1_012).query(
      'Booking',
      selection,
      async () => booking
    );

    expect(result.errors).toEqual([]);
    expect(result.data).toEqual({ id: 'booking-1', client: { firstName: 'Ada' } });
    expect(result.elapsedMs).toBe(12);
    expect(result.withinLatencyBudget).toBe(true);
  });

  it('rejects invalid selections before calling the resolver', async () => {
    const resolve = jest.fn(async () => booking);
    const result = await gateway(() => 0).query(
      'Booking',
      [{ field: 'unknown' }],
      resolve
    );

    expect(resolve).not.toHaveBeenCalled();
    expect(result.data).toEqual({});
    expect(result.errors).toEqual([{ path: 'Booking.unknown', message: 'unknown_field' }]);
  });

  it('reports resolver failures and flags budget overruns', async () => {
    const times = [0, 90];
    const failing = await gateway(() => times.shift() ?? 90).query(
      'Booking',
      selection,
      async () => {
        throw new Error('downstream');
      }
    );
    expect(failing.errors).toEqual([{ path: 'Booking', message: 'resolver_failed' }]);
    expect(failing.withinLatencyBudget).toBe(false);

    const slow = await new EdgeGateway({
      latencyBudgetMs: 50,
      now: (() => {
        const values = [0, 51];
        return () => values.shift() ?? 51;
      })(),
    }).query('Booking', selection, async () => booking);
    expect(slow.elapsedMs).toBe(51);
    expect(slow.withinLatencyBudget).toBe(false);
  });

  it('exposes the internal service registry for gRPC-style calls', () => {
    const instance = new EdgeGateway();
    expect(instance.registry.list()).toEqual([]);
  });
});
