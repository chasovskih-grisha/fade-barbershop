import { ClientLoyaltyState } from '../domain/client-loyalty-state';
import type { LoyaltyCommandContext } from '../domain/ports';
import { DomainEvent } from '../domain/domain-event';

export class LoyaltyPointsExpiredEvent extends DomainEvent {
  readonly type = 'loyalty.points.expired';
  readonly payload: Record<string, unknown>;

  constructor(params: {
    aggregateId: string;
    clientId: string;
    expiredPoints: number;
    occurredAt: Date;
  }) {
    super({ occurredAt: params.occurredAt, aggregateId: params.aggregateId });
    this.payload = {
      clientId: params.clientId,
      expiredPoints: params.expiredPoints,
    };
  }
}

export interface ExpireInactiveLoyaltyPointsInput {
  inactivityDays?: number;
  occurredAt?: Date;
}

export interface ExpireInactiveLoyaltyPointsResult {
  processedClientsCount: number;
  totalExpiredPoints: number;
  expiredClients: Array<{ clientId: string; expiredPoints: number }>;
  executedAt: Date;
}

export class ExpireInactiveLoyaltyPointsHandler {
  constructor(private readonly ctx: LoyaltyCommandContext) {}

  async handle(input: ExpireInactiveLoyaltyPointsInput = {}): Promise<ExpireInactiveLoyaltyPointsResult> {
    const now = input.occurredAt ?? this.ctx.clock.now();
    const inactivityDays = input.inactivityDays ?? 365;
    const thresholdDate = new Date(now.getTime() - inactivityDays * 24 * 60 * 60 * 1000);

    const allStates = this.ctx.states.findAll ? await this.ctx.states.findAll() : [];
    
    let totalExpiredPoints = 0;
    const expiredClients: Array<{ clientId: string; expiredPoints: number }> = [];
    const eventsToPublish: DomainEvent[] = [];

    for (const state of allStates) {
      if (state.pointsBalance > 0 && state.updatedAt < thresholdDate) {
        const expiredPoints = state.pointsBalance;
        state.spendPoints(expiredPoints, now);
        await this.ctx.states.save(state);

        totalExpiredPoints += expiredPoints;
        expiredClients.push({ clientId: state.clientId, expiredPoints });

        eventsToPublish.push(
          new LoyaltyPointsExpiredEvent({
            aggregateId: state.clientId,
            clientId: state.clientId,
            expiredPoints,
            occurredAt: now,
          })
        );
      }
    }

    if (eventsToPublish.length > 0 && this.ctx.outbox) {
      await this.ctx.outbox.append(eventsToPublish);
    }

    return {
      processedClientsCount: expiredClients.length,
      totalExpiredPoints,
      expiredClients,
      executedAt: now,
    };
  }
}
