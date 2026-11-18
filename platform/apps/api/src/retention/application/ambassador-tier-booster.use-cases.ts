import { AmbassadorTierEngine, AmbassadorTierRule } from '../domain/ambassador-tier-booster.entity';
import { RetentionRepository } from './retention.repository';

export interface AmbassadorProfile {
  clientId: string;
  clientName: string;
  totalReferrals: number;
  currentTier: string;
  serviceDiscountPercentage: number;
  totalBonusPointsEarned: number;
  unlockedPerks: string[];
  updatedAt: string;
}

export class EvaluateAndUpgradeAmbassadorUseCase {
  constructor(private readonly retentionRepository: RetentionRepository) {}

  async execute(params: {
    clientId: string;
    clientName: string;
    referralCount: number;
  }): Promise<AmbassadorProfile> {
    const rule: AmbassadorTierRule = AmbassadorTierEngine.evaluateTier(params.referralCount);

    const profile: AmbassadorProfile = {
      clientId: params.clientId,
      clientName: params.clientName,
      totalReferrals: params.referralCount,
      currentTier: rule.tier,
      serviceDiscountPercentage: rule.serviceDiscountPercentage,
      totalBonusPointsEarned: rule.bonusPointsAward,
      unlockedPerks: rule.perks,
      updatedAt: new Date().toISOString(),
    };

    await this.retentionRepository.saveRetentionIncentive({
      id: `AMB-${params.clientId}-${rule.tier}`,
      clientId: params.clientId,
      tier: rule.tier.includes('GOLD') || rule.tier.includes('ELITE') ? 'VIP' : 'GOLD',
      pointsBalance: rule.bonusPointsAward,
      unlockedPerks: rule.perks,
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return profile;
  }
}
