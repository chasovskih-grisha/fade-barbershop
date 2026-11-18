import { ClientMilestoneEngine } from './domain/client-milestone-engine.entity';

describe('ClientMilestoneEngine', () => {
  it('should evaluate 5th visit milestone correctly', () => {
    const milestone = ClientMilestoneEngine.evaluateVisitMilestone(5);
    expect(milestone).not.toBeNull();
    expect(milestone?.threshold).toBe(5);
    expect(milestone?.rewardDiscountPercentage).toBe(15);
    expect(milestone?.bonusLoyaltyPoints).toBe(250);
  });

  it('should evaluate 25th visit milestone correctly', () => {
    const milestone = ClientMilestoneEngine.evaluateVisitMilestone(25);
    expect(milestone?.threshold).toBe(25);
    expect(milestone?.rewardDiscountPercentage).toBe(25);
    expect(milestone?.bonusLoyaltyPoints).toBe(1000);
  });

  it('should return null for non-milestone visits', () => {
    const milestone = ClientMilestoneEngine.evaluateVisitMilestone(7);
    expect(milestone).toBeNull();
  });

  it('should evaluate yearly anniversary correctly', () => {
    const anniversary = ClientMilestoneEngine.evaluateAnniversaryMilestone(2);
    expect(anniversary?.type).toBe('YEARLY_ANNIVERSARY');
    expect(anniversary?.rewardDiscountPercentage).toBe(20);
    expect(anniversary?.bonusLoyaltyPoints).toBe(600);
  });

  it('should evaluate birthday perk correctly', () => {
    const birthday = ClientMilestoneEngine.evaluateBirthday();
    expect(birthday.type).toBe('BIRTHDAY');
    expect(birthday.rewardDiscountPercentage).toBe(30);
    expect(birthday.bonusLoyaltyPoints).toBe(1000);
  });
});
