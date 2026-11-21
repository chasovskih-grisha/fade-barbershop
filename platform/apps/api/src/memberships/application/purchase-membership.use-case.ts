/* eslint-disable max-params -- 1 signature whose 4-param contract is fixed by existing call sites (worst: an existing definition, limit 3); API redesign tracked in T-2500f */
import { MembershipInstance } from '../domain/membership-instance.entity';
import {
  MembershipPlanRepository,
  MembershipInstanceRepository,
  OutboxPublisher,
  Clock,
} from '../domain/ports';
import { DomainEvent } from '../domain/domain-event';

export class MembershipPurchasedEvent extends DomainEvent {
  readonly type = 'membership.purchased';
  readonly payload: Record<string, unknown>;

  constructor(params: {
    aggregateId: string;
    clientId: string;
    planId: string;
    startDate: Date;
    endDate: Date;
    visitLimit: number;
    occurredAt: Date;
  }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.aggregateId });
    this.payload = {
      membershipId: params.aggregateId,
      clientId: params.clientId,
      planId: params.planId,
      startDate: params.startDate.toISOString(),
      endDate: params.endDate.toISOString(),
      visitLimit: params.visitLimit,
    };
  }
}

export interface PurchaseMembershipInput {
  membershipId: string;
  clientId: string;
  planId: string;
  occurredAt?: Date;
}

export class PurchaseMembershipUseCase {
  constructor(
    private readonly plansRepo: MembershipPlanRepository,
    private readonly instancesRepo: MembershipInstanceRepository,
    private readonly outbox: OutboxPublisher,
    private readonly clock: Clock
  ) {}

  async handle(input: PurchaseMembershipInput): Promise<MembershipInstance> {
    const now = input.occurredAt ?? this.clock.now();
    const plan = await this.plansRepo.findById(input.planId);
    if (!plan) {
      throw new Error(`Membership plan with id '${input.planId}' not found`);
    }
    if (!plan.isActive) {
      throw new Error(`Membership plan '${plan.name}' is inactive`);
    }

    const instance = MembershipInstance.createNew({
      id: input.membershipId,
      clientId: input.clientId,
      planId: plan.id,
      visitLimit: plan.visitLimit,
      durationDays: plan.durationDays,
      now,
    });

    await this.instancesRepo.save(instance);

    const event = new MembershipPurchasedEvent({
      aggregateId: instance.id,
      clientId: instance.clientId,
      planId: instance.planId,
      startDate: instance.startDate,
      endDate: instance.endDate,
      visitLimit: instance.visitLimit,
      occurredAt: now,
    });

    await this.outbox.append([event]);

    return instance;
  }
}
