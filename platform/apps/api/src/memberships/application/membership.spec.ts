/* eslint-disable max-lines -- cohesive module (168 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
import { MembershipPlan } from '../domain/membership-plan.entity';
import { MembershipInstance } from '../domain/membership-instance.entity';
import {
  MembershipPlanRepository,
  MembershipInstanceRepository,
  OutboxPublisher,
  Clock,
} from '../domain/ports';
import { DomainEvent } from '../domain/domain-event';
import { PurchaseMembershipUseCase } from './purchase-membership.use-case';
import { UseMembershipVisitUseCase } from './use-membership-visit.use-case';
import {
  PauseMembershipUseCase,
  ResumeMembershipUseCase,
} from './pause-resume-membership.use-case';

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

describe('FADE Memberships & Subscriptions Specialist Suite', () => {
  let planRepo: InMemoryPlanRepo;
  let instanceRepo: InMemoryInstanceRepo;
  let outbox: InMemoryOutbox;
  let clock: TestClock;

  beforeEach(() => {
    planRepo = new InMemoryPlanRepo();
    instanceRepo = new InMemoryInstanceRepo();
    outbox = new InMemoryOutbox();
    clock = new TestClock(new Date('2026-11-12T10:00:00Z'));
  });

  it('creates and purchases a membership plan successfully', async () => {
    const plan = MembershipPlan.createNew({
      id: 'plan-gold',
      name: 'Gold Monthly Pass',
      price: 2500,
      durationDays: 30,
      visitLimit: 5,
      discountPercent: 15,
      now: clock.now(),
    });
    await planRepo.save(plan);

    const purchaseHandler = new PurchaseMembershipUseCase(planRepo, instanceRepo, outbox, clock);
    const instance = await purchaseHandler.handle({
      membershipId: 'mem-inst-1',
      clientId: 'client-123',
      planId: 'plan-gold',
    });

    expect(instance).toBeDefined();
    expect(instance.clientId).toBe('client-123');
    expect(instance.planId).toBe('plan-gold');
    expect(instance.remainingVisits).toBe(5);
    expect(instance.status).toBe('ACTIVE');

    expect(outbox.events).toHaveLength(1);
    expect(outbox.events[0]?.type).toBe('membership.purchased');
    expect(outbox.events[0]?.payload).toMatchObject({
      membershipId: 'mem-inst-1',
      clientId: 'client-123',
      planId: 'plan-gold',
      visitLimit: 5,
    });
  });

  it('uses membership visits correctly and decrements remaining visits', async () => {
    const plan = MembershipPlan.createNew({
      id: 'plan-vip',
      name: 'VIP Unlimited',
      price: 5000,
      durationDays: 30,
      visitLimit: 2,
      now: clock.now(),
    });
    await planRepo.save(plan);

    const purchaseHandler = new PurchaseMembershipUseCase(planRepo, instanceRepo, outbox, clock);
    await purchaseHandler.handle({
      membershipId: 'mem-inst-2',
      clientId: 'client-456',
      planId: 'plan-vip',
    });

    const useVisitHandler = new UseMembershipVisitUseCase(instanceRepo, outbox, clock);

    // First visit
    let res = await useVisitHandler.handle({
      membershipId: 'mem-inst-2',
      clientId: 'client-456',
    });
    expect(res.remainingVisits).toBe(1);

    // Second visit
    res = await useVisitHandler.handle({
      membershipId: 'mem-inst-2',
      clientId: 'client-456',
    });
    expect(res.remainingVisits).toBe(0);

    const instance = await instanceRepo.findById('mem-inst-2');
    expect(instance?.status).toBe('COMPLETED');

    // Third visit should fail
    await expect(
      useVisitHandler.handle({
        membershipId: 'mem-inst-2',
        clientId: 'client-456',
      })
    ).rejects.toThrow("Cannot use membership visit when status is 'COMPLETED'");
  });

  it('supports pausing and resuming membership with endDate extension', async () => {
    const plan = MembershipPlan.createNew({
      id: 'plan-std',
      name: 'Standard Pass',
      price: 1500,
      durationDays: 30,
      visitLimit: 4,
      now: clock.now(),
    });
    await planRepo.save(plan);

    const purchaseHandler = new PurchaseMembershipUseCase(planRepo, instanceRepo, outbox, clock);
    await purchaseHandler.handle({
      membershipId: 'mem-inst-3',
      clientId: 'client-789',
      planId: 'plan-std',
    });

    const instanceBefore = await instanceRepo.findById('mem-inst-3');
    const originalEndDate = instanceBefore?.endDate;
    if (!originalEndDate) throw new Error('expected original end date');

    const pauseHandler = new PauseMembershipUseCase(instanceRepo, outbox, clock);
    const resumeHandler = new ResumeMembershipUseCase(instanceRepo, outbox, clock);

    // Pause on Nov 12
    await pauseHandler.handle({
      membershipId: 'mem-inst-3',
      clientId: 'client-789',
    });

    expect((await instanceRepo.findById('mem-inst-3'))?.status).toBe('PAUSED');

    // Advance clock by 5 days (Nov 17)
    clock.setTime(new Date('2026-11-17T10:00:00Z'));

    // Resume on Nov 17
    await resumeHandler.handle({
      membershipId: 'mem-inst-3',
      clientId: 'client-789',
    });

    const instanceAfter = await instanceRepo.findById('mem-inst-3');
    expect(instanceAfter?.status).toBe('ACTIVE');
    expect(instanceAfter?.pauseHistory).toHaveLength(1);
    expect(instanceAfter?.pauseHistory?.[0]?.resumedAt).toBeDefined();

    // End date should be extended by 5 days
    const expectedEndDate = new Date(originalEndDate.getTime() + 5 * 24 * 60 * 60 * 1000);
    expect(instanceAfter?.endDate?.getTime()).toBe(expectedEndDate.getTime());
  });
});
