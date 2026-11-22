import { InMemoryEventStore, OptimisticConcurrencyError } from './event-store';
import type { DomainEvent } from './types';

function event(id: string, amount = 10): DomainEvent<{ amount: number }> {
  return {
    id,
    name: 'PaymentCaptured',
    aggregateId: 'payment-1',
    occurredAt: new Date(0),
    version: 1,
    payload: { amount },
  };
}

describe('InMemoryEventStore (T-5001)', () => {
  it('assigns per-stream sequence numbers and keeps global order', () => {
    const store = new InMemoryEventStore();
    store.append('payment-1', [event('e1'), event('e2')]);
    store.append('payment-1', [event('e3')]);
    store.append('payment-2', [event('e4')]);

    expect(store.readStream('payment-1').map((s) => s.sequence)).toEqual([1, 2, 3]);
    expect(store.readAll().map((s) => s.event.id)).toEqual(['e1', 'e2', 'e3', 'e4']);
    expect(store.version('payment-1')).toBe(3);
    expect(store.version('missing')).toBe(0);
  });

  it('rejects an append whose expected version is stale', () => {
    const store = new InMemoryEventStore();
    store.append('payment-1', [event('e1')]);

    expect(() => store.append('payment-1', [event('e2')], 0)).toThrow(
      OptimisticConcurrencyError
    );
  });

  it('replays a stream into aggregate state', () => {
    const store = new InMemoryEventStore();
    store.append('payment-1', [event('e1', 25), event('e2', 75)]);

    const total = store.replay('payment-1', (sum, stored) => {
      const payload = stored.payload as { amount: number };
      return sum + payload.amount;
    }, 0);

    expect(total).toBe(100);
  });

  it('returns copies so callers cannot mutate the log', () => {
    const store = new InMemoryEventStore();
    store.append('payment-1', [event('e1')]);
    const stream = store.readStream('payment-1') as unknown as unknown[];
    stream.push('tampered');

    expect(store.readStream('payment-1')).toHaveLength(1);
  });
});
