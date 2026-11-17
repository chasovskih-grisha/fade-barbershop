import { ClientLoyaltyState } from '../domain/client-loyalty-state';
import { CalculateLoyaltyDiscountHandler } from './calculate-loyalty-discount.use-case';
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

describe('CalculateLoyaltyDiscountHandler', () => {
  it('calculates automated tier discount for Silver and Gold clients', async () => {
    const states = new InMemoryLoyaltyRepository();
    const outbox = new InMemoryOutbox();
    const clock = new TestClock(new Date('2026-11-10T12:00:00Z'));
    const handler = new CalculateLoyaltyDiscountHandler({ states, outbox, clock });

    const clientId = 'client-silver-1';
    const state = ClientLoyaltyState.createNew(clientId, clock.now());
    state.setTier('SILVER', clock.now());
    await states.save(state);

    const result = await handler.handle({
      clientId,
      servicePrices: { 'service-haircut': 800, 'service-beard': 400 }, // total 1200
    });

    expect(result.tier).toBe('SILVER');
    expect(result.discountPercent).toBe(5);
    expect(result.originalTotal).toBe(1200);
    expect(result.discountedTotal).toBe(1140); // 5% off 1200 is 60 off -> 1140
    expect(result.savedAmount).toBe(60);
    expect(result.freeVisitRedeemed).toBe(false);
  });

  it('redeems free visit correctly and sets total to 0', async () => {
    const states = new InMemoryLoyaltyRepository();
    const outbox = new InMemoryOutbox();
    const clock = new TestClock(new Date('2026-11-10T12:00:00Z'));
    const handler = new CalculateLoyaltyDiscountHandler({ states, outbox, clock });

    const clientId = 'client-free-visit';
    const state = ClientLoyaltyState.createNew(clientId, clock.now());
    state.setFreeVisit(true, clock.now());
    await states.save(state);

    const result = await handler.handle({
      clientId,
      servicePrices: { 'service-haircut': 1000 },
      redeemFreeVisit: true,
      appointmentId: 'apt-999',
    });

    expect(result.freeVisitRedeemed).toBe(true);
    expect(result.discountedTotal).toBe(0);
    expect(result.savedAmount).toBe(1000);
    expect(result.hasFreeVisitAvailable).toBe(false);

    expect(outbox.events).toHaveLength(1);
    expect(outbox.events[0]?.type).toBe('loyalty.free_visit.applied');
  });
});
