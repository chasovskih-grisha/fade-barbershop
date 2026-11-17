import { ClientLoyaltyState } from '../domain/client-loyalty-state';
import { ExpireInactiveLoyaltyPointsHandler } from './expire-inactive-loyalty-points.use-case';
import type { ClientLoyaltyStateRepository, OutboxPublisher, Clock } from '../domain/ports';
import { DomainEvent } from '../domain/domain-event';

class InMemoryLoyaltyRepository implements ClientLoyaltyStateRepository {
  private states = new Map<string, ClientLoyaltyState>();

  async findByClientId(clientId: string): Promise<ClientLoyaltyState | null> {
    return this.states.get(clientId) ?? null;
  }

  async save(state: ClientLoyaltyState): Promise<void> {
    this.states.set(state.clientId, ClientLoyaltyState.reconstitute(state.propsData));
  }

  async findAll(): Promise<ClientLoyaltyState[]> {
    return Array.from(this.states.values());
  }

  seed(state: ClientLoyaltyState): void {
    this.states.set(state.clientId, state);
  }
}

class InMemoryOutbox implements OutboxPublisher {
  readonly events: DomainEvent[] = [];

  async append(events: DomainEvent[]): Promise<void> {
    this.events.push(...events);
  }
}

class TestClock implements Clock {
  constructor(private nowTime: Date = new Date()) {}
  now(): Date {
    return this.nowTime;
  }
}

describe('Expire Inactive Loyalty Points (T-4551)', () => {
  let states: InMemoryLoyaltyRepository;
  let outbox: InMemoryOutbox;
  let clock: TestClock;
  let handler: ExpireInactiveLoyaltyPointsHandler;

  beforeEach(() => {
    states = new InMemoryLoyaltyRepository();
    outbox = new InMemoryOutbox();
    clock = new TestClock(new Date('2026-11-13T12:00:00Z'));
    handler = new ExpireInactiveLoyaltyPointsHandler({ states, outbox, clock });
  });

  it('expires points for clients inactive beyond threshold', async () => {
    const oldDate = new Date('2025-01-01T12:00:00Z'); // more than 365 days ago
    const recentDate = new Date('2026-10-01T12:00:00Z'); // recent

    const inactiveState = ClientLoyaltyState.reconstitute({
      clientId: 'client-inactive',
      counter: 2,
      hasFreeVisit: false,
      tier: 'SILVER',
      pointsBalance: 500,
      cashbackBalance: 0,
      processedAppointmentIds: ['apt-1'],
      updatedAt: oldDate,
    });

    const activeState = ClientLoyaltyState.reconstitute({
      clientId: 'client-active',
      counter: 1,
      hasFreeVisit: false,
      tier: 'GOLD',
      pointsBalance: 1200,
      cashbackBalance: 0,
      processedAppointmentIds: ['apt-2'],
      updatedAt: recentDate,
    });

    states.seed(inactiveState);
    states.seed(activeState);

    const res = await handler.handle({ inactivityDays: 365, occurredAt: clock.now() });

    expect(res.processedClientsCount).toBe(1);
    expect(res.totalExpiredPoints).toBe(500);
    expect(res.expiredClients).toEqual([{ clientId: 'client-inactive', expiredPoints: 500 }]);

    const updatedInactive = await states.findByClientId('client-inactive');
    expect(updatedInactive?.pointsBalance).toBe(0);

    const updatedActive = await states.findByClientId('client-active');
    expect(updatedActive?.pointsBalance).toBe(1200);

    const event = outbox.events.find((e) => e.type === 'loyalty.points.expired');
    expect(event).toBeDefined();
    expect(event?.payload).toMatchObject({
      clientId: 'client-inactive',
      expiredPoints: 500,
    });
  });
});
