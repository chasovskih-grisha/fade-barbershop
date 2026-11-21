import { MembershipInstanceRepository, OutboxPublisher, Clock } from '../domain/ports';
import { DomainEvent } from '../domain/domain-event';

export class MembershipVisitUsedEvent extends DomainEvent {
  readonly type = 'membership.visit_used';
  readonly payload: Record<string, unknown>;

  constructor(params: {
    aggregateId: string;
    clientId: string;
    remainingVisits: number;
    occurredAt: Date;
  }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.aggregateId });
    this.payload = {
      membershipId: params.aggregateId,
      clientId: params.clientId,
      remainingVisits: params.remainingVisits,
    };
  }
}

export interface UseMembershipVisitInput {
  membershipId: string;
  clientId: string;
  occurredAt?: Date;
}

export class UseMembershipVisitUseCase {
  constructor(
    private readonly instancesRepo: MembershipInstanceRepository,
    private readonly outbox: OutboxPublisher,
    private readonly clock: Clock
  ) {}

  async handle(input: UseMembershipVisitInput): Promise<{ remainingVisits: number }> {
    const now = input.occurredAt ?? this.clock.now();
    const instance = await this.instancesRepo.findById(input.membershipId);
    if (!instance) {
      throw new Error(`Membership instance with id '${input.membershipId}' not found`);
    }
    if (instance.clientId !== input.clientId) {
      throw new Error('Membership does not belong to this client');
    }

    const { remainingVisits } = instance.useVisit(now);
    await this.instancesRepo.save(instance);

    const event = new MembershipVisitUsedEvent({
      aggregateId: instance.id,
      clientId: instance.clientId,
      remainingVisits,
      occurredAt: now,
    });

    await this.outbox.append([event]);

    return { remainingVisits };
  }
}
