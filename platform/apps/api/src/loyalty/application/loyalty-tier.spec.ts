import { ClientLoyaltyState } from '../domain/client-loyalty-state';
import { EvaluateLoyaltyTierHandler } from './evaluate-loyalty-tier.use-case';
import { determineLoyaltyTier, DEFAULT_LOYALTY_TIERS } from '../domain/loyalty-tier';
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

describe('Loyalty Tiers & VIP Perks (FADE Specialist Feature)', () => {
  it('correctly determines tier based on visit thresholds', () => {
    expect(determineLoyaltyTier(0, DEFAULT_LOYALTY_TIERS).level).toBe('BRONZE');
    expect(determineLoyaltyTier(4, DEFAULT_LOYALTY_TIERS).level).toBe('BRONZE');
    expect(determineLoyaltyTier(5, DEFAULT_LOYALTY_TIERS).level).toBe('SILVER');
    expect(determineLoyaltyTier(11, DEFAULT_LOYALTY_TIERS).level).toBe('SILVER');
    expect(determineLoyaltyTier(12, DEFAULT_LOYALTY_TIERS).level).toBe('GOLD');
    expect(determineLoyaltyTier(24, DEFAULT_LOYALTY_TIERS).level).toBe('GOLD');
    expect(determineLoyaltyTier(25, DEFAULT_LOYALTY_TIERS).level).toBe('PLATINUM');
    expect(determineLoyaltyTier(50, DEFAULT_LOYALTY_TIERS).level).toBe('PLATINUM');
  });

  it('evaluates and upgrades client loyalty tier with event emission', async () => {
    const states = new InMemoryLoyaltyRepository();
    const outbox = new InMemoryOutbox();
    const clock = new TestClock(new Date('2026-11-10T12:00:00Z'));
    const handler = new EvaluateLoyaltyTierHandler({ states, outbox, clock, threshold: 7 });

    const clientId = 'client-vip-1';

    // Initial evaluation at 3 visits (Bronze)
    let res = await handler.handle({
      clientId,
      totalCompletedVisits: 3,
      occurredAt: clock.now(),
    });
    expect(res.tier).toBe('BRONZE');
    expect(res.discountPercent).toBe(0);
    expect(res.upgraded).toBe(false);
    expect(outbox.events).toHaveLength(0);

    // Reaching 12 visits -> Gold tier upgrade
    res = await handler.handle({
      clientId,
      totalCompletedVisits: 12,
      occurredAt: clock.now(),
    });
    expect(res.tier).toBe('GOLD');
    expect(res.discountPercent).toBe(10);
    expect(res.upgraded).toBe(true);

    const tierEvent = outbox.events.find((e) => e.type === 'loyalty.tier.changed');
    expect(tierEvent).toBeDefined();
    expect(tierEvent?.payload).toMatchObject({
      clientId,
      oldTier: 'BRONZE',
      newTier: 'GOLD',
      discountPercent: 10,
      totalVisits: 12,
    });
  });
});
