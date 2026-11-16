import { DistributedEventBus, DomainEvent, EventSourcedAggregate } from '../src/events/event-bus';

describe('DistributedEventBus & EventSourcedAggregate', () => {
  it('should publish and handle events successfully', async () => {
    const bus = new DistributedEventBus();
    const handledEvents: DomainEvent[] = [];

    bus.subscribe('AppointmentBooked', async (event) => {
      handledEvents.push(event);
    });

    const event: DomainEvent = {
      eventId: 'evt-1',
      eventType: 'AppointmentBooked',
      aggregateId: 'app-123',
      timestamp: Date.now(),
      payload: { barberId: 'barber-1', clientId: 'client-1' }
    };

    await bus.publish(event);
    expect(handledEvents.length).toBe(1);
    expect(handledEvents[0].eventId).toBe('evt-1');
  });

  it('should push to DLQ after max retries fail', async () => {
    const bus = new DistributedEventBus({ maxRetries: 2, retryBackoffMs: 10 });
    
    bus.subscribe('PaymentFailed', async () => {
      throw new Error('Database timeout');
    });

    const event: DomainEvent = {
      eventId: 'evt-2',
      eventType: 'PaymentFailed',
      aggregateId: 'pay-456',
      timestamp: Date.now(),
      payload: { amount: 5000 }
    };

    await bus.publish(event);
    const dlq = bus.getDeadLetterQueue();
    expect(dlq.length).toBe(1);
    expect(dlq[0].eventId).toBe('evt-2');
    expect((dlq[0].metadata as any).error).toBe('Database timeout');
  });

  it('should track aggregate events correctly', () => {
    const aggregate = new EventSourcedAggregate('shop-1');
    expect(aggregate.getVersion()).toBe(0);

    const event: DomainEvent = {
      eventId: 'evt-3',
      eventType: 'ShopOpened',
      aggregateId: 'shop-1',
      timestamp: Date.now(),
      payload: { openingTime: '09:00' }
    };

    aggregate.applyEvent(event);
    expect(aggregate.getVersion()).toBe(1);
    expect(aggregate.getUncommittedEvents().length).toBe(1);
  });
});
