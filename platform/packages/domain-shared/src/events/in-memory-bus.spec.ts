import { InMemoryEventBus } from './in-memory-bus';
import type { DomainEvent } from './types';

const noSleep = (): Promise<void> => Promise.resolve();

function event(id: string, name = 'AppointmentBooked'): DomainEvent {
  return {
    id,
    name,
    aggregateId: 'aggregate-1',
    occurredAt: new Date(0),
    version: 1,
    payload: { id },
  };
}

function bus(maxAttempts = 3): InMemoryEventBus {
  return new InMemoryEventBus({
    retryPolicy: { maxAttempts, baseDelayMs: 1, maxDelayMs: 4 },
    sleep: noSleep,
    random: () => 0,
  });
}

describe('InMemoryEventBus (T-5001)', () => {
  it('delivers an event to every subscriber of its name', async () => {
    const target = bus();
    const seen: string[] = [];
    target.subscribe('AppointmentBooked', (evt) => {
      seen.push(`a:${evt.id}`);
    });
    target.subscribe('AppointmentBooked', (evt) => {
      seen.push(`b:${evt.id}`);
    });
    target.subscribe('PaymentCaptured', () => {
      seen.push('wrong');
    });

    await target.publish([event('e1')]);

    expect(seen).toEqual(['a:e1', 'b:e1']);
    expect(target.deliveredIds).toEqual(['e1']);
  });

  it('stops delivering after unsubscribe and still acknowledges the event', async () => {
    const target = bus();
    const handler = jest.fn();
    const unsubscribe = target.subscribe('AppointmentBooked', handler);
    unsubscribe();

    await target.publish([event('e1')]);

    expect(handler).not.toHaveBeenCalled();
    expect(target.deadLetterQueue).toHaveLength(0);
  });

  it('retries a failing handler with at-least-once semantics', async () => {
    const target = bus();
    let attempts = 0;
    const first = jest.fn();
    target.subscribe('AppointmentBooked', first);
    target.subscribe('AppointmentBooked', () => {
      attempts += 1;
      if (attempts < 3) throw new Error('transport hiccup');
    });

    await target.publish([event('e1')]);

    expect(first).toHaveBeenCalledTimes(3);
    expect(target.deadLetterQueue).toHaveLength(0);
    expect(target.deliveredIds).toEqual(['e1']);
  });

  it('moves an event to the DLQ once the attempt budget is spent', async () => {
    const target = bus(2);
    target.subscribe('PaymentCaptured', () => {
      throw new Error('gateway down');
    });

    await target.publish([event('e2', 'PaymentCaptured')]);

    expect(target.deadLetterQueue).toHaveLength(1);
    expect(target.deadLetterQueue[0]?.reason).toBe('gateway down');
    expect(target.deadLetterQueue[0]?.envelope.attempt).toBe(2);
    expect(target.deliveredIds).toEqual([]);
  });
});
