import { MembershipInstanceRepository, OutboxPublisher, Clock } from '../domain/ports';
import { DomainEvent } from '../domain/domain-event';

export class MembershipPausedEvent extends DomainEvent {
  readonly type = 'membership.paused';
  readonly payload: Record<string, unknown>;

  constructor(params: {
    aggregateId: string;
    clientId: string;
    occurredAt: Date;
  }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.aggregateId });
    this.payload = {
      membershipId: params.aggregateId,
      clientId: params.clientId,
      pausedAt: params.occurredAt.toISOString(),
    };
  }
}

export class MembershipResumedEvent extends DomainEvent {
  readonly type = 'membership.resumed';
  readonly payload: Record<string, unknown>;

  constructor(params: {
    aggregateId: string;
    clientId: string;
    newEndDate: Date;
    occurredAt: Date;
  }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.aggregateId });
    this.payload = {
      membershipId: params.aggregateId,
      clientId: params.clientId,
      resumedAt: params.occurredAt.toISOString(),
      newEndDate: params.newEndDate.toISOString(),
    };
  }
}

export class PauseMembershipUseCase {
  constructor(
    private readonly instancesRepo: MembershipInstanceRepository,
    private readonly outbox: OutboxPublisher,
    private readonly clock: Clock,
  ) {}

  async handle(input: { membershipId: string; clientId: string; occurredAt?: Date }): Promise<void> {
    const now = input.occurredAt ?? this.clock.now();
    const instance = await this.instancesRepo.findById(input.membershipId);
    if (!instance) {
      throw new Error(`Membership instance '${input.membershipId}' not found`);
    }
    if (instance.clientId !== input.clientId) {
      throw new Error('Membership does not belong to this client');
    }

    instance.pause(now);
    await this.instancesRepo.save(instance);

    await this.outbox.append([
      new MembershipPausedEvent({
        aggregateId: instance.id,
        clientId: instance.clientId,
        occurredAt: now,
      }),
    ]);
  }
}

export class ResumeMembershipUseCase {
  constructor(
    private readonly instancesRepo: MembershipInstanceRepository,
    private readonly outbox: OutboxPublisher,
    private readonly clock: Clock,
  ) {}

  async handle(input: { membershipId: string; clientId: string; occurredAt?: Date }): Promise<void> {
    const now = input.occurredAt ?? this.clock.now();
    const instance = await this.instancesRepo.findById(input.membershipId);
    if (!instance) {
      throw new Error(`Membership instance '${input.membershipId}' not found`);
    }
    if (instance.clientId !== input.clientId) {
      throw new Error('Membership does not belong to this client');
    }

    instance.resume(now);
    await this.instancesRepo.save(instance);

    await this.outbox.append([
      new MembershipResumedEvent({
        aggregateId: instance.id,
        clientId: instance.clientId,
        newEndDate: instance.endDate,
        occurredAt: now,
      }),
    ]);
  }
}
