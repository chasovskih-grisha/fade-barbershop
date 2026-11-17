import { ClientLoyaltyState } from '../domain/client-loyalty-state';
import { DEFAULT_LOYALTY_TIERS, determineLoyaltyTier } from '../domain/loyalty-tier';

export interface LoyaltyCostReportInput {
  allStates: ClientLoyaltyState[];
  pointValueUah?: number;
  freeVisitEquivalentUah?: number;
  currency?: string;
}

export interface LoyaltyCostReportResult {
  totalClientsWithLoyalty: number;
  totalCompletedVisitsRecorded: number;
  freeVisitsAvailableCount: number;
  freeVisitsReserveLiabilityUah: number;
  tierDistribution: Record<string, number>;
  estimatedFinancialLiabilityUah: number;
  generatedAt: Date;
}

export class CalculateLoyaltyCostReportHandler {
  constructor(private readonly defaultPointValueUah: number = 1.0, private readonly defaultFreeVisitValueUah: number = 800.0) {}

  handle(input: LoyaltyCostReportInput): LoyaltyCostReportResult {
    const freeVisitValue = input.freeVisitEquivalentUah ?? this.defaultFreeVisitValueUah;

    let totalVisitsRecorded = 0;
    let freeVisitsCount = 0;
    const tierDistribution: Record<string, number> = {
      BRONZE: 0,
      SILVER: 0,
      GOLD: 0,
      PLATINUM: 0,
    };

    for (const state of input.allStates) {
      const visits = state.counter + (state.hasFreeVisit ? 7 : 0);
      totalVisitsRecorded += visits;
      if (state.hasFreeVisit) {
        freeVisitsCount += 1;
      }
      const tierConfig = determineLoyaltyTier(visits, DEFAULT_LOYALTY_TIERS);
      const tierLevel = state.tier !== 'BRONZE' ? state.tier : tierConfig.level;
      tierDistribution[tierLevel] = (tierDistribution[tierLevel] ?? 0) + 1;
    }

    const freeVisitsReserveLiabilityUah = freeVisitsCount * freeVisitValue;
    const estimatedFinancialLiabilityUah = freeVisitsReserveLiabilityUah;

    return {
      totalClientsWithLoyalty: input.allStates.length,
      totalCompletedVisitsRecorded: totalVisitsRecorded,
      freeVisitsAvailableCount: freeVisitsCount,
      freeVisitsReserveLiabilityUah,
      tierDistribution,
      estimatedFinancialLiabilityUah,
      generatedAt: new Date(),
    };
  }
}
