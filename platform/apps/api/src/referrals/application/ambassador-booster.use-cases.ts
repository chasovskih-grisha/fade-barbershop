import { AmbassadorProfileEntity, AmbassadorBoosterEngine } from '../domain/ambassador-booster.entity';
import { ReferralRepository } from './referral.repository';

export class ProcessAmbassadorReferralMilestoneUseCase {
  constructor(private readonly referralRepository: ReferralRepository) {}

  async execute(params: {
    clientId: string;
    clientName: string;
    newSuccessfulReferrals: number;
  }): Promise<AmbassadorProfileEntity> {
    const { tier, reward, creditBonusCents } = AmbassadorBoosterEngine.calculateTierAndRewards(
      params.newSuccessfulReferrals
    );

    const profile: AmbassadorProfileEntity = {
      id: `AMB-${params.clientId}`,
      clientId: params.clientId,
      clientName: params.clientName,
      totalSuccessfulReferrals: params.newSuccessfulReferrals,
      currentTier: tier,
      earnedRewards: [reward],
      bonusCreditCents: creditBonusCents,
      updatedAt: new Date().toISOString(),
    };

    return profile;
  }
}
