import { AmbassadorTierEngine } from './domain/ambassador-tier-booster.entity';
import { EvaluateAndUpgradeAmbassadorUseCase } from './application/ambassador-tier-booster.use-cases';
import { InMemoryRetentionRepository } from './application/in-memory-retention.repository';

describe('AmbassadorTierBooster', () => {
  it('evaluates correct tiers based on referral count', () => {
    expect(AmbassadorTierEngine.evaluateTier(0).tier).toBe('AMBASSADOR_BRONZE');
    expect(AmbassadorTierEngine.evaluateTier(1).tier).toBe('AMBASSADOR_BRONZE');
    expect(AmbassadorTierEngine.evaluateTier(3).tier).toBe('AMBASSADOR_SILVER');
    expect(AmbassadorTierEngine.evaluateTier(5).tier).toBe('AMBASSADOR_GOLD');
    expect(AmbassadorTierEngine.evaluateTier(10).tier).toBe('AMBASSADOR_ELITE');
  });

  it('upgrades client ambassador profile and saves retention incentive', async () => {
    const repository = new InMemoryRetentionRepository();
    const useCase = new EvaluateAndUpgradeAmbassadorUseCase(repository);

    const profile = await useCase.execute({
      clientId: 'client-999',
      clientName: 'Alex Mercer',
      referralCount: 5,
    });

    expect(profile.currentTier).toBe('AMBASSADOR_GOLD');
    expect(profile.serviceDiscountPercentage).toBe(20);
    expect(profile.totalBonusPointsEarned).toBe(1000);
    expect(profile.unlockedPerks).toContain('Complimentary Whiskey & Beverage Bar');

    const saved = await repository.findRetentionIncentiveByClient('client-999');
    expect(saved).not.toBeNull();
    expect(saved?.pointsBalance).toBe(1000);
  });
});
