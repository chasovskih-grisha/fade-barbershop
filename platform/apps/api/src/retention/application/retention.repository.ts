import { ReactivationFlowEntity, ClientOnboardingSequenceEntity, RetentionIncentiveEntity, MilestoneRewardEntity } from '../domain/retention.entity';

export interface RetentionRepository {
  saveReactivationFlow(flow: ReactivationFlowEntity): Promise<void>;
  findReactivationFlowById(id: string): Promise<ReactivationFlowEntity | null>;
  findReactivationFlowsByClient(clientId: string): Promise<ReactivationFlowEntity[]>;

  saveOnboardingSequence(sequence: ClientOnboardingSequenceEntity): Promise<void>;
  findOnboardingSequenceByClient(clientId: string): Promise<ClientOnboardingSequenceEntity | null>;

  saveRetentionIncentive(incentive: RetentionIncentiveEntity): Promise<void>;
  findRetentionIncentiveByClient(clientId: string): Promise<RetentionIncentiveEntity | null>;

  saveMilestoneReward(reward: MilestoneRewardEntity): Promise<void>;
  findMilestoneRewardsByClient(clientId: string): Promise<MilestoneRewardEntity[]>;
}

