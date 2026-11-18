import { AmbassadorBoosterEngine } from './domain/ambassador-booster.entity';
import { ProcessAmbassadorReferralMilestoneUseCase } from './application/ambassador-booster.use-cases';
import { InMemoryReferralRepository } from './application/in-memory-referral.repository';

describe('Customer Acquisition Specialist - Ambassador Referral Milestone Booster', () => {
  let repository: InMemoryReferralRepository;

  beforeEach(() => {
    repository = new InMemoryReferralRepository();
  });

  it('evaluates ambassador tiers correctly based on successful referral counts', () => {
    const bronze = AmbassadorBoosterEngine.calculateTierAndRewards(1);
    expect(bronze.tier).toBe('BRONZE_AMBASSADOR');
    expect(bronze.creditBonusCents).toBe(1000);

    const silver = AmbassadorBoosterEngine.calculateTierAndRewards(3);
    expect(silver.tier).toBe('SILVER_AMBASSADOR');
    expect(silver.reward).toContain('Free Haircut');

    const gold = AmbassadorBoosterEngine.calculateTierAndRewards(6);
    expect(gold.tier).toBe('GOLD_AMBASSADOR');
    expect(gold.creditBonusCents).toBe(5000);

    const diamond = AmbassadorBoosterEngine.calculateTierAndRewards(12);
    expect(diamond.tier).toBe('DIAMOND_EMISSARY');
    expect(diamond.reward).toContain('Lifetime 15% VIP Discount');
  });

  it('processes ambassador milestone upgrade use case', async () => {
    const useCase = new ProcessAmbassadorReferralMilestoneUseCase(repository);

    const profile = await useCase.execute({
      clientId: 'client-amb-1',
      clientName: 'Marcus Vance',
      newSuccessfulReferrals: 5,
    });

    expect(profile.currentTier).toBe('GOLD_AMBASSADOR');
    expect(profile.totalSuccessfulReferrals).toBe(5);
    expect(profile.bonusCreditCents).toBe(5000);
    expect(profile.earnedRewards).toContain('VIP Styling Kit + 500 Loyalty Points + Free Beard Spa');
  });
});
