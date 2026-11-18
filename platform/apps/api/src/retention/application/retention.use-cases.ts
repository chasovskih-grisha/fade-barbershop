import { RetentionRepository } from './retention.repository';
import { ReactivationFlowEntity, ClientOnboardingSequenceEntity, RetentionIncentiveEntity, MilestoneRewardEntity, ReactivationTriggerType } from '../domain/retention.entity';

export class TriggerReactivationFlowUseCase {
  constructor(private readonly retentionRepository: RetentionRepository) {}

  async execute(params: {
    id: string;
    clientId: string;
    clientEmail: string;
    clientPhone: string;
    triggerType: ReactivationTriggerType;
    lastVisitDate: string;
    daysInactive: number;
  }): Promise<ReactivationFlowEntity> {
    const discountPercentage = params.daysInactive >= 90 ? 25 : params.daysInactive >= 60 ? 20 : 15;
    const incentiveCode = `WINBACK-${params.daysInactive}D-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const flow: ReactivationFlowEntity = {
      id: params.id,
      clientId: params.clientId,
      clientEmail: params.clientEmail,
      clientPhone: params.clientPhone,
      triggerType: params.triggerType,
      lastVisitDate: params.lastVisitDate,
      daysInactive: params.daysInactive,
      incentiveCode,
      discountPercentage,
      status: 'SENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.retentionRepository.saveReactivationFlow(flow);
    return flow;
  }
}

export class EnrollClientOnboardingUseCase {
  constructor(private readonly retentionRepository: RetentionRepository) {}

  async execute(params: {
    clientId: string;
    clientEmail: string;
    clientPhone: string;
  }): Promise<ClientOnboardingSequenceEntity> {
    const sequence: ClientOnboardingSequenceEntity = {
      id: `ONB-${Date.now()}`,
      clientId: params.clientId,
      clientEmail: params.clientEmail,
      clientPhone: params.clientPhone,
      currentStep: 'WELCOME_SMS',
      welcomeSentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.retentionRepository.saveOnboardingSequence(sequence);
    return sequence;
  }
}

export class GrantRetentionIncentiveUseCase {
  constructor(private readonly retentionRepository: RetentionRepository) {}

  async execute(params: {
    clientId: string;
    tier: 'SILVER' | 'GOLD' | 'VIP';
    pointsBalance: number;
    unlockedPerks: string[];
  }): Promise<RetentionIncentiveEntity> {
    const incentive: RetentionIncentiveEntity = {
      id: `INC-${Date.now()}`,
      clientId: params.clientId,
      tier: params.tier,
      pointsBalance: params.pointsBalance,
      unlockedPerks: params.unlockedPerks,
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.retentionRepository.saveRetentionIncentive(incentive);
    return incentive;
  }
}

export class ProcessClientVisitMilestoneUseCase {
  constructor(private readonly retentionRepository: RetentionRepository) {}

  async execute(params: {
    clientId: string;
    visitCount: number;
  }): Promise<MilestoneRewardEntity | null> {
    let milestoneTitle = '';
    let bonusPoints = 0;
    let unlockedPerk = '';

    if (params.visitCount === 5) {
      milestoneTitle = 'Bronze Regular Milestone (5 Visits)';
      bonusPoints = 250;
      unlockedPerk = 'Complimentary Styling Product';
    } else if (params.visitCount === 10) {
      milestoneTitle = 'Silver Elite Milestone (10 Visits)';
      bonusPoints = 500;
      unlockedPerk = 'Free Hot Towel Shave';
    } else if (params.visitCount === 25) {
      milestoneTitle = 'Gold Legend Milestone (25 Visits)';
      bonusPoints = 1500;
      unlockedPerk = 'VIP Lounge Access & Complimentary Whiskey';
    } else {
      return null;
    }

    const reward: MilestoneRewardEntity = {
      id: `MILESTONE-${params.clientId}-${params.visitCount}`,
      clientId: params.clientId,
      visitCount: params.visitCount,
      milestoneTitle,
      bonusPoints,
      unlockedPerk,
      awardedAt: new Date().toISOString(),
    };

    await this.retentionRepository.saveMilestoneReward(reward);

    // Also update incentive points if exists
    const existingIncentive = await this.retentionRepository.findRetentionIncentiveByClient(params.clientId);
    if (existingIncentive) {
      existingIncentive.pointsBalance += bonusPoints;
      if (!existingIncentive.unlockedPerks.includes(unlockedPerk)) {
        existingIncentive.unlockedPerks.push(unlockedPerk);
      }
      existingIncentive.updatedAt = new Date().toISOString();
      await this.retentionRepository.saveRetentionIncentive(existingIncentive);
    }

    return reward;
  }
}

