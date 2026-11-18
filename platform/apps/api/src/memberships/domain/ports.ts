import { MembershipPlan } from './membership-plan.entity';
import { MembershipInstance } from './membership-instance.entity';
import { GiftMembership } from './gift-membership.entity';
import { DomainEvent } from './domain-event';

export interface MembershipPlanRepository {
  findById(id: string): Promise<MembershipPlan | null>;
  save(plan: MembershipPlan): Promise<void>;
}

export interface MembershipInstanceRepository {
  findById(id: string): Promise<MembershipInstance | null>;
  findByClientId(clientId: string): Promise<MembershipInstance[]>;
  save(instance: MembershipInstance): Promise<void>;
}

export interface GiftMembershipRepository {
  findById(id: string): Promise<GiftMembership | null>;
  findByCode(code: string): Promise<GiftMembership | null>;
  save(gift: GiftMembership): Promise<void>;
}

export interface MembershipCodeGenerator {
  generateCode(): string;
}

export interface OutboxPublisher {
  append(events: DomainEvent[]): Promise<void>;
}

export interface Clock {
  now(): Date;
}
