import { MembershipPlan } from '../domain/membership-plan.entity';
import { MembershipInstance } from '../domain/membership-instance.entity';
import { GiftMembership } from '../domain/gift-membership.entity';
import { MembershipPlanRepository, MembershipInstanceRepository, GiftMembershipRepository, MembershipCodeGenerator, OutboxPublisher, Clock } from '../domain/ports';
import { DomainEvent } from '../domain/domain-event';
import { PurchaseGiftMembershipUseCase } from './purchase-gift-membership.use-case';
import { RedeemGiftMembershipUseCase } from './redeem-gift-membership.use-case';

class InMemoryPlanRepo implements MembershipPlanRepository {
  private plans = new Map<string, MembershipPlan>();
  async findById(id: string): Promise<MembershipPlan | null> {
    return this.plans.get(id) ?? null;
  }
  async save(plan: MembershipPlan): Promise<void> {
    this.plans.set(plan.id, MembershipPlan.reconstitute(plan.propsData));
  }
}

class InMemoryInstanceRepo implements MembershipInstanceRepository {
  private instances = new Map<string, MembershipInstance>();
  async findById(id: string): Promise<MembershipInstance | null> {
    return this.instances.get(id) ?? null;
  }
  async findByClientId(clientId: string): Promise<MembershipInstance[]> {
    return Array.from(this.instances.values()).filter((i) => i.clientId === clientId);
  }
  async save(instance: MembershipInstance): Promise<void> {
    this.instances.set(instance.id, MembershipInstance.reconstitute(instance.propsData));
  }
}

class InMemoryGiftRepo implements GiftMembershipRepository {
  private gifts = new Map<string, GiftMembership>();
  async findById(id: string): Promise<GiftMembership | null> {
    return this.gifts.get(id) ?? null;
  }
  async findByCode(code: string): Promise<GiftMembership | null> {
    for (const g of this.gifts.values()) {
      if (g.code === code) return GiftMembership.reconstitute(g.propsData);
    }
    return null;
  }
  async save(gift: GiftMembership): Promise<void> {
    this.gifts.set(gift.id, GiftMembership.reconstitute(gift.propsData));
  }
}

class TestCodeGenerator implements MembershipCodeGenerator {
  generateCode(): string {
    return 'GIFT-FADE-9999';
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
  setTime(time: Date): void {
    this.nowTime = time;
  }
}

describe('FADE Gift Membership Suite', () => {
  let planRepo: InMemoryPlanRepo;
  let instanceRepo: InMemoryInstanceRepo;
  let giftRepo: InMemoryGiftRepo;
  let codeGen: TestCodeGenerator;
  let outbox: InMemoryOutbox;
  let clock: TestClock;

  beforeEach(() => {
    planRepo = new InMemoryPlanRepo();
    instanceRepo = new InMemoryInstanceRepo();
    giftRepo = new InMemoryGiftRepo();
    codeGen = new TestCodeGenerator();
    outbox = new InMemoryOutbox();
    clock = new TestClock(new Date('2026-11-12T10:00:00Z'));
  });

  it('allows purchasing and redeeming a gift membership successfully', async () => {
    const plan = MembershipPlan.createNew({
      id: 'plan-gold',
      name: 'Gold Gift Pass',
      price: 3000,
      durationDays: 30,
      visitLimit: 4,
      now: clock.now(),
    });
    await planRepo.save(plan);

    const purchaseHandler = new PurchaseGiftMembershipUseCase(
      planRepo,
      giftRepo,
      codeGen,
      outbox,
      clock,
    );

    const gift = await purchaseHandler.handle({
      giftId: 'gift-1',
      planId: 'plan-gold',
      purchaserClientId: 'client-buyer',
      recipientEmail: 'friend@example.com',
    });

    expect(gift.code).toBe('GIFT-FADE-9999');
    expect(gift.status).toBe('ACTIVE');
    expect(outbox.events[0]?.type).toBe('membership.gift.purchased');

    const redeemHandler = new RedeemGiftMembershipUseCase(
      giftRepo,
      planRepo,
      instanceRepo,
      outbox,
      clock,
    );

    const instance = await redeemHandler.handle({
      code: 'gift-fade-9999',
      clientId: 'client-recipient',
      membershipInstanceId: 'mem-inst-gift-1',
    });

    expect(instance).toBeDefined();
    expect(instance.clientId).toBe('client-recipient');
    expect(instance.planId).toBe('plan-gold');
    expect(instance.remainingVisits).toBe(4);
    expect(instance.status).toBe('ACTIVE');

    const updatedGift = await giftRepo.findById('gift-1');
    expect(updatedGift?.status).toBe('REDEEMED');

    // Trying to redeem again should fail
    await expect(
      redeemHandler.handle({
        code: 'GIFT-FADE-9999',
        clientId: 'client-someone-else',
        membershipInstanceId: 'mem-inst-gift-2',
      }),
    ).rejects.toThrow('Gift membership has already been redeemed');
  });

  it('rejects redeeming an expired gift membership', async () => {
    const plan = MembershipPlan.createNew({
      id: 'plan-std',
      name: 'Standard Pass',
      price: 1500,
      durationDays: 30,
      visitLimit: 2,
      now: clock.now(),
    });
    await planRepo.save(plan);

    const purchaseHandler = new PurchaseGiftMembershipUseCase(
      planRepo,
      giftRepo,
      codeGen,
      outbox,
      clock,
    );

    await purchaseHandler.handle({
      giftId: 'gift-2',
      planId: 'plan-std',
      purchaserClientId: 'client-buyer',
      validityDays: 10,
    });

    // Advance clock by 15 days
    clock.setTime(new Date('2026-11-27T10:00:00Z'));

    const redeemHandler = new RedeemGiftMembershipUseCase(
      giftRepo,
      planRepo,
      instanceRepo,
      outbox,
      clock,
    );

    await expect(
      redeemHandler.handle({
        code: 'GIFT-FADE-9999',
        clientId: 'client-recipient',
        membershipInstanceId: 'mem-inst-gift-3',
      }),
    ).rejects.toThrow('Gift membership has expired');
  });
});
