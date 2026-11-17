import { ApplyReferralLoyaltyBonusHandler } from './apply-referral-loyalty-bonus.use-case';
import { ClientLoyaltyState } from '../domain/client-loyalty-state';
import type { LoyaltyCommandContext, ClientLoyaltyStateRepository, OutboxPublisher, Clock } from '../domain/ports';

class InMemoryLoyaltyStateRepo implements ClientLoyaltyStateRepository {
  private store = new Map<string, ClientLoyaltyState>();

  async findByClientId(clientId: string): Promise<ClientLoyaltyState | null> {
    return this.store.get(clientId) ?? null;
  }

  async save(state: ClientLoyaltyState): Promise<void> {
    this.store.set(state.clientId, state);
  }
}

class InMemoryOutbox implements OutboxPublisher {
  events: any[] = [];
  async append(events: any[]): Promise<void> {
    this.events.push(...events);
  }
}

class MockClock implements Clock {
  constructor(private nowTime = new Date('2026-11-13T10:00:00Z')) {}
  now(): Date {
    return this.nowTime;
  }
}

describe('ApplyReferralLoyaltyBonusHandler', () => {
  it('awards referral bonus points and cashback to referrer and welcome bonus to referee', async () => {
    const statesRepo = new InMemoryLoyaltyStateRepo();
    const outbox = new InMemoryOutbox();
    const clock = new MockClock();
    const ctx: LoyaltyCommandContext = { states: statesRepo, outbox, clock };

    const handler = new ApplyReferralLoyaltyBonusHandler(ctx);
    const result = await handler.handle({
      referrerClientId: 'client-referrer-1',
      refereeClientId: 'client-referee-1',
      bonusPoints: 600,
      bonusCashback: 200,
    });

    expect(result.referrerClientId).toBe('client-referrer-1');
    expect(result.refereeClientId).toBe('client-referee-1');
    expect(result.referrerNewPointsBalance).toBe(600);
    expect(result.referrerNewCashbackBalance).toBe(200);
    expect(result.refereeNewPointsBalance).toBe(300); // half of 600
    expect(outbox.events.length).toBe(3);
  });
});
