/* eslint-disable max-lines -- cohesive module (104 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
import { ClientLoyaltyState } from '../domain/client-loyalty-state';
import { EarnCashbackHandler } from './earn-cashback.use-case';
import { RedeemCashbackHandler } from './redeem-cashback.use-case';
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

describe('Loyalty Cashback & Redemption (T-4551)', () => {
  let states: InMemoryLoyaltyRepository;
  let outbox: InMemoryOutbox;
  let clock: TestClock;
  let earnCashbackHandler: EarnCashbackHandler;
  let redeemCashbackHandler: RedeemCashbackHandler;

  beforeEach(() => {
    states = new InMemoryLoyaltyRepository();
    outbox = new InMemoryOutbox();
    clock = new TestClock(new Date('2026-11-12T12:00:00Z'));
    const ctx = { states, outbox, clock };
    earnCashbackHandler = new EarnCashbackHandler(ctx);
    redeemCashbackHandler = new RedeemCashbackHandler(ctx);
  });

  it('earns cashback correctly based on amount paid and cashback percent', async () => {
    const clientId = 'client-cb-1';

    const res = await earnCashbackHandler.handle({
      clientId,
      amountPaid: 1500, // 1500 UAH -> 5% cashback = 75 UAH
      cashbackPercent: 5.0,
      appointmentId: 'apt-cb-1',
      occurredAt: clock.now(),
    });

    expect(res.cashbackEarned).toBe(75);
    expect(res.newBalance).toBe(75);

    const event = outbox.events.find((e) => e.type === 'loyalty.cashback.earned');
    expect(event).toBeDefined();
    expect(event?.payload).toMatchObject({
      clientId,
      amount: 75,
      newBalance: 75,
      appointmentId: 'apt-cb-1',
    });
  });

  it('redeems cashback successfully when balance is sufficient', async () => {
    const clientId = 'client-cb-2';

    // Earn cashback first
    await earnCashbackHandler.handle({
      clientId,
      amountPaid: 2000,
      cashbackPercent: 5.0,
      occurredAt: clock.now(),
    }); // 100 UAH cashback

    const redeemRes = await redeemCashbackHandler.handle({
      clientId,
      amountToRedeem: 30,
      appointmentId: 'apt-cb-2',
      occurredAt: clock.now(),
    });

    expect(redeemRes.success).toBe(true);
    expect(redeemRes.amountRedeemed).toBe(30);
    expect(redeemRes.newBalance).toBe(70);

    const event = outbox.events.find((e) => e.type === 'loyalty.cashback.spent');
    expect(event).toBeDefined();
    expect(event?.payload).toMatchObject({
      clientId,
      amount: 30,
      newBalance: 70,
      appointmentId: 'apt-cb-2',
    });
  });

  it('fails to redeem cashback if balance is insufficient', async () => {
    const clientId = 'client-cb-3';

    await earnCashbackHandler.handle({
      clientId,
      amountPaid: 200, // 6 UAH cashback
      cashbackPercent: 3.0,
      occurredAt: clock.now(),
    });

    const redeemRes = await redeemCashbackHandler.handle({
      clientId,
      amountToRedeem: 50,
      occurredAt: clock.now(),
    });

    expect(redeemRes.success).toBe(false);
    expect(redeemRes.amountRedeemed).toBe(0);
    expect(redeemRes.newBalance).toBe(6);
  });
});
