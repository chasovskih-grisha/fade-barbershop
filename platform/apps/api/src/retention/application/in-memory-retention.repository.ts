import { RetentionRepository } from './retention.repository';
import {
  ReactivationFlowEntity,
  ClientOnboardingSequenceEntity,
  RetentionIncentiveEntity,
  MilestoneRewardEntity,
} from '../domain/retention.entity';

export class InMemoryRetentionRepository implements RetentionRepository {
  private reactivationFlows = new Map<string, ReactivationFlowEntity>();
  private onboardingSequences = new Map<string, ClientOnboardingSequenceEntity>();
  private retentionIncentives = new Map<string, RetentionIncentiveEntity>();
  private milestoneRewards = new Map<string, MilestoneRewardEntity[]>();

  async saveReactivationFlow(flow: ReactivationFlowEntity): Promise<void> {
    this.reactivationFlows.set(flow.id, flow);
  }

  async findReactivationFlowById(id: string): Promise<ReactivationFlowEntity | null> {
    return this.reactivationFlows.get(id) || null;
  }

  async findReactivationFlowsByClient(clientId: string): Promise<ReactivationFlowEntity[]> {
    return Array.from(this.reactivationFlows.values()).filter((f) => f.clientId === clientId);
  }

  async saveOnboardingSequence(sequence: ClientOnboardingSequenceEntity): Promise<void> {
    this.onboardingSequences.set(sequence.clientId, sequence);
  }

  async findOnboardingSequenceByClient(
    clientId: string
  ): Promise<ClientOnboardingSequenceEntity | null> {
    return this.onboardingSequences.get(clientId) || null;
  }

  async saveRetentionIncentive(incentive: RetentionIncentiveEntity): Promise<void> {
    this.retentionIncentives.set(incentive.clientId, incentive);
  }

  async findRetentionIncentiveByClient(clientId: string): Promise<RetentionIncentiveEntity | null> {
    return this.retentionIncentives.get(clientId) || null;
  }

  async saveMilestoneReward(reward: MilestoneRewardEntity): Promise<void> {
    const existing = this.milestoneRewards.get(reward.clientId) || [];
    this.milestoneRewards.set(reward.clientId, [...existing, reward]);
  }

  async findMilestoneRewardsByClient(clientId: string): Promise<MilestoneRewardEntity[]> {
    return this.milestoneRewards.get(clientId) || [];
  }
}
