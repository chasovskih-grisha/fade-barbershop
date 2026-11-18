import { InMemoryRetentionRepository } from './application/in-memory-retention.repository';
import { TriggerReactivationFlowUseCase, EnrollClientOnboardingUseCase, GrantRetentionIncentiveUseCase, ProcessClientVisitMilestoneUseCase } from './application/retention.use-cases';

describe('Customer Acquisition & Retention Specialist - Retention & Reactivation Flows', () => {
  let repository: InMemoryRetentionRepository;

  beforeEach(() => {
    repository = new InMemoryRetentionRepository();
  });

  it('triggers win-back reactivation flow with tiered discounts based on inactivity', async () => {
    const useCase = new TriggerReactivationFlowUseCase(repository);

    const flow60 = await useCase.execute({
      id: 'flow-1',
      clientId: 'client-100',
      clientEmail: 'john@example.com',
      clientPhone: '+380501112233',
      triggerType: 'INACTIVE_60_DAYS',
      lastVisitDate: '2026-09-01',
      daysInactive: 65,
    });

    expect(flow60.status).toBe('SENT');
    expect(flow60.discountPercentage).toBe(20);
    expect(flow60.incentiveCode).toContain('WINBACK-65D');

    const flow90 = await useCase.execute({
      id: 'flow-2',
      clientId: 'client-101',
      clientEmail: 'alex@example.com',
      clientPhone: '+380501112244',
      triggerType: 'INACTIVE_90_DAYS',
      lastVisitDate: '2026-08-01',
      daysInactive: 95,
    });

    expect(flow90.discountPercentage).toBe(25);
    expect(flow90.incentiveCode).toContain('WINBACK-95D');
  });

  it('enrolls new client in onboarding welcome sequence', async () => {
    const useCase = new EnrollClientOnboardingUseCase(repository);

    const sequence = await useCase.execute({
      clientId: 'client-new-1',
      clientEmail: 'newclient@example.com',
      clientPhone: '+380509998877',
    });

    expect(sequence.currentStep).toBe('WELCOME_SMS');
    expect(sequence.welcomeSentAt).toBeDefined();

    const stored = await repository.findOnboardingSequenceByClient('client-new-1');
    expect(stored).toEqual(sequence);
  });

  it('grants retention incentives and tier perks', async () => {
    const useCase = new GrantRetentionIncentiveUseCase(repository);

    const incentive = await useCase.execute({
      clientId: 'client-vip-1',
      tier: 'VIP',
      pointsBalance: 1250,
      unlockedPerks: ['Free Beard Trim', 'Complimentary Whiskey', 'Priority Booking'],
    });

    expect(incentive.tier).toBe('VIP');
    expect(incentive.pointsBalance).toBe(1250);
    expect(incentive.unlockedPerks.length).toBe(3);

    const stored = await repository.findRetentionIncentiveByClient('client-vip-1');
    expect(stored).toEqual(incentive);
  });

  it('processes VIP visit milestones and rewards bonus points and perks', async () => {
    const grantUseCase = new GrantRetentionIncentiveUseCase(repository);
    await grantUseCase.execute({
      clientId: 'client-milestone-1',
      tier: 'SILVER',
      pointsBalance: 100,
      unlockedPerks: ['Priority Booking'],
    });

    const milestoneUseCase = new ProcessClientVisitMilestoneUseCase(repository);
    const reward = await milestoneUseCase.execute({
      clientId: 'client-milestone-1',
      visitCount: 10,
    });

    expect(reward).toBeDefined();
    expect(reward?.visitCount).toBe(10);
    expect(reward?.bonusPoints).toBe(500);
    expect(reward?.unlockedPerk).toBe('Free Hot Towel Shave');

    const updatedIncentive = await repository.findRetentionIncentiveByClient('client-milestone-1');
    expect(updatedIncentive?.pointsBalance).toBe(600);
    expect(updatedIncentive?.unlockedPerks).toContain('Free Hot Towel Shave');
  });
});

