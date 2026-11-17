import { ClientLoyaltyState } from '../domain/client-loyalty-state';
import type { LoyaltyCommandContext } from '../domain/ports';
import { LoyaltyTierChanged } from '../domain/loyalty-events';
import { determineLoyaltyTier, DEFAULT_LOYALTY_TIERS } from '../domain/loyalty-tier';

export interface EvaluateLoyaltyTierInput {
  clientId: string;
  totalCompletedVisits: number;
  occurredAt: Date;
}

export class EvaluateLoyaltyTierHandler {
  constructor(private readonly ctx: LoyaltyCommandContext) {}

  async handle(input: EvaluateLoyaltyTierInput): Promise<{ tier: string; discountPercent: number; upgraded: boolean }> {
    let state = await this.ctx.states.findByClientId(input.clientId);
    if (!state) {
      state = ClientLoyaltyState.createNew(input.clientId, input.occurredAt);
    }

    const currentTier = determineLoyaltyTier(input.totalCompletedVisits, DEFAULT_LOYALTY_TIERS);
    const oldTier = state.tier;
    const upgraded = oldTier !== currentTier.level;

    if (upgraded) {
      state.setTier(currentTier.level, input.occurredAt);
      await this.ctx.states.save(state);
      await this.ctx.outbox.append([
        new LoyaltyTierChanged({
          clientId: input.clientId,
          oldTier,
          newTier: currentTier.level,
          discountPercent: currentTier.discountPercent,
          totalVisits: input.totalCompletedVisits,
          occurredAt: input.occurredAt,
        }),
      ]);
    }

    return {
      tier: currentTier.level,
      discountPercent: currentTier.discountPercent,
      upgraded,
    };
  }
}
