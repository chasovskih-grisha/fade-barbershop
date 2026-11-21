/* eslint-disable max-lines -- cohesive module (103 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
import { ClientLoyaltyState } from '../domain/client-loyalty-state';
import { EarnLoyaltyPointsHandler } from './earn-loyalty-points.use-case';
import { RedeemLoyaltyPointsHandler } from './redeem-loyalty-points.use-case';
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

describe('Loyalty Points & Redemption (T-4551)', () => {
  let states: InMemoryLoyaltyRepository;
  let outbox: InMemoryOutbox;
  let clock: TestClock;
  let earnHandler: EarnLoyaltyPointsHandler;
  let redeemHandler: RedeemLoyaltyPointsHandler;

  beforeEach(() => {
    states = new InMemoryLoyaltyRepository();
    outbox = new InMemoryOutbox();
    clock = new TestClock(new Date('2026-11-12T12:00:00Z'));
    const ctx = { states, outbox, clock };
    earnHandler = new EarnLoyaltyPointsHandler(ctx);
    redeemHandler = new RedeemLoyaltyPointsHandler(ctx);
  });

  it('earns loyalty points correctly based on amount paid and tier multiplier', async () => {
    const clientId = 'client-points-1';

    const res = await earnHandler.handle({
      clientId,
      amountPaid: 1000, // 1000 UAH -> 5% = 50 points * 1.5 multiplier = 75 points
      tierMultiplier: 1.5,
      appointmentId: 'apt-p1',
      occurredAt: clock.now(),
    });

    expect(res.pointsEarned).toBe(75);
    expect(res.newBalance).toBe(75);

    const event = outbox.events.find((e) => e.type === 'loyalty.points.earned');
    expect(event).toBeDefined();
    expect(event?.payload).toMatchObject({
      clientId,
      points: 75,
      newBalance: 75,
      appointmentId: 'apt-p1',
    });
  });

  it('redeems loyalty points successfully when balance is sufficient', async () => {
    const clientId = 'client-points-2';

    // Earn points first
    await earnHandler.handle({
      clientId,
      amountPaid: 2000,
      tierMultiplier: 1.0,
      occurredAt: clock.now(),
    }); // 2000 * 0.05 = 100 points

    const redeemRes = await redeemHandler.handle({
      clientId,
      pointsToRedeem: 40,
      appointmentId: 'apt-p2',
      occurredAt: clock.now(),
    });

    expect(redeemRes.success).toBe(true);
    expect(redeemRes.pointsRedeemed).toBe(40);
    expect(redeemRes.newBalance).toBe(60);

    const event = outbox.events.find((e) => e.type === 'loyalty.points.spent');
    expect(event).toBeDefined();
    expect(event?.payload).toMatchObject({
      clientId,
      points: 40,
      newBalance: 60,
      appointmentId: 'apt-p2',
    });
  });

  it('fails to redeem points if balance is insufficient', async () => {
    const clientId = 'client-points-3';

    await earnHandler.handle({
      clientId,
      amountPaid: 200, // 10 points
      occurredAt: clock.now(),
    });

    const redeemRes = await redeemHandler.handle({
      clientId,
      pointsToRedeem: 50,
      occurredAt: clock.now(),
    });

    expect(redeemRes.success).toBe(false);
    expect(redeemRes.pointsRedeemed).toBe(0);
    expect(redeemRes.newBalance).toBe(10);
  });
});
