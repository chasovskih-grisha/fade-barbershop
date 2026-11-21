import { ClientLoyaltyState } from '../domain/client-loyalty-state';
import { EvaluateMembershipPerksHandler } from './evaluate-membership-perks.use-case';
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

describe('EvaluateMembershipPerksHandler', () => {
  it('evaluates loyalty tier points multiplier and membership perks correctly', async () => {
    const states = new InMemoryLoyaltyRepository();
    const outbox = new InMemoryOutbox();
    const clock = new TestClock(new Date('2026-11-12T12:00:00Z'));
    const handler = new EvaluateMembershipPerksHandler({ states, outbox, clock });

    const clientId = 'client-vip-1';
    const state = ClientLoyaltyState.createNew(clientId, clock.now());
    state.setTier('GOLD', clock.now());
    await states.save(state);

    const result = await handler.handle({
      clientId,
      hasActiveMembership: true,
      membershipPlanName: 'VIP Unlimited Membership',
      isAnniversaryOrBirthday: false,
      basePointsEarnable: 100,
    });

    expect(result.tier).toBe('GOLD');
    expect(result.pointsMultiplier).toBe(2.0); // 1.5 (GOLD) + 0.5 (membership)
    expect(result.finalPointsEarnable).toBe(200); // 100 * 2.0
    expect(result.membershipBoostActive).toBe(true);
    expect(result.appliedPerks.some((p) => p.includes('VIP Unlimited Membership'))).toBe(true);
  });

  it('applies birthday / anniversary 2x multiplier boost', async () => {
    const states = new InMemoryLoyaltyRepository();
    const outbox = new InMemoryOutbox();
    const clock = new TestClock(new Date('2026-11-12T12:00:00Z'));
    const handler = new EvaluateMembershipPerksHandler({ states, outbox, clock });

    const clientId = 'client-bday-1';
    const result = await handler.handle({
      clientId,
      hasActiveMembership: false,
      isAnniversaryOrBirthday: true,
      basePointsEarnable: 50,
    });

    expect(result.tier).toBe('BRONZE');
    expect(result.pointsMultiplier).toBe(2.0); // 1.0 (BRONZE) * 2.0 (birthday)
    expect(result.finalPointsEarnable).toBe(100);
    expect(result.appliedPerks).toContain(
      'Birthday/Anniversary Bonus: 2x Points Multiplier Active'
    );
  });
});
