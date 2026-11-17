import { ClientLoyaltyState } from '../domain/client-loyalty-state';
import { determineLoyaltyTier, DEFAULT_LOYALTY_TIERS, LoyaltyTierConfig } from '../domain/loyalty-tier';
import type { LoyaltyCommandContext } from '../domain/ports';
import { FreeVisitApplied } from '../domain/loyalty-events';

export interface CalculateLoyaltyDiscountInput {
  clientId: string;
  servicePrices: Record<string, number>; // serviceId -> base price
  redeemFreeVisit?: boolean;
  appointmentId?: string;
  occurredAt?: Date;
}

export interface CalculateLoyaltyDiscountResult {
  clientId: string;
  tier: string;
  discountPercent: number;
  perks: string[];
  originalTotal: number;
  discountedTotal: number;
  savedAmount: number;
  freeVisitRedeemed: boolean;
  hasFreeVisitAvailable: boolean;
  counter: number;
}

export class CalculateLoyaltyDiscountHandler {
  constructor(private readonly ctx: LoyaltyCommandContext) {}

  async handle(input: CalculateLoyaltyDiscountInput): Promise<CalculateLoyaltyDiscountResult> {
    const now = input.occurredAt ?? this.ctx.clock.now();
    let state = await this.ctx.states.findByClientId(input.clientId);
    if (!state) {
      state = ClientLoyaltyState.createNew(input.clientId, now);
    }

    const totalVisits = state.counter + (state.hasFreeVisit ? 6 : 0); // estimation or tracked visits
    const tierConfig: LoyaltyTierConfig = determineLoyaltyTier(totalVisits, DEFAULT_LOYALTY_TIERS);

    // Override tier if stored on state
    const currentTierName = state.tier || tierConfig.level;
    const resolvedTier = DEFAULT_LOYALTY_TIERS.find((t) => t.level === currentTierName) || tierConfig;

    const originalTotal = Object.values(input.servicePrices).reduce((sum, p) => sum + p, 0);
    let discountedTotal = originalTotal;
    let freeVisitRedeemed = false;

    if (input.redeemFreeVisit && state.hasFreeVisit) {
      discountedTotal = 0;
      freeVisitRedeemed = true;
      if (input.appointmentId) {
        state.applyFreeVisit(input.appointmentId, now);
        await this.ctx.states.save(state);
        await this.ctx.outbox.append([
          new FreeVisitApplied({
            clientId: input.clientId,
            appointmentId: input.appointmentId,
            occurredAt: now,
          }),
        ]);
      }
    } else if (resolvedTier.discountPercent > 0) {
      const discountMultiplier = (100 - resolvedTier.discountPercent) / 100;
      discountedTotal = Math.round(originalTotal * discountMultiplier);
    }

    const savedAmount = originalTotal - discountedTotal;

    return {
      clientId: input.clientId,
      tier: resolvedTier.level,
      discountPercent: freeVisitRedeemed ? 100 : resolvedTier.discountPercent,
      perks: resolvedTier.perks,
      originalTotal,
      discountedTotal,
      savedAmount,
      freeVisitRedeemed,
      hasFreeVisitAvailable: state.hasFreeVisit,
      counter: state.counter,
    };
  }
}
