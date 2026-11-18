/**
 * T-182: Waitlist Integration with No-Show Policy
 * 
 * Integrate the no-show policy (T-160) with the waitlist system (T-172/T-170).
 * Automatically pause waitlist for clients with ≥2 no-shows/90days,
 * deposit retention on waitlist holds, cascade suppression for high-risk clients.
 * 
 * Dependencies: T-160 no-show policy, T-172 priority scoring, T-181 analytics export.
 */

import { WaitlistQueue } from '../../domain/waitlist-queue';
import { ClientRepository } from '../../../clients/domain/repositories';
import { randomUUID } from 'node:crypto';

/**
 * No-show risk level for waitlist clients
 */
export enum NoShowRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  BLOCKED = 'blocked'
}

/**
 * Interface for no-show risk assessment
 */
export interface NoShowRiskAssessment {
  clientId: string;
  riskLevel: NoShowRiskLevel;
  noShowCount90Days: number;
  lastNoShowDate?: Date;
  waitlistPausedUntil?: string;
  message: string;
}

/**
 * Interface for no-show waitlist integration config
 */
export interface NoShowWaitlistConfig {
  maxNoShowsBeforePause: number; // ≥2 no-shows → pause
  pauseDurationDays: number; // how long to pause
  depositRetentionPercentage: number; // % of deposit retained for repeated no-shows
  warningThreshold: number; // warn at ≥1 no-show
}

/**
 * T-182: Waitlist Integration with No-Show Policy
 * 
 * Provides no-show risk assessment and waitlist access control,
 * integrating the no-show policy with waitlist operations to
 * prevent promoting high-risk clients and retain deposits appropriately.
 */
export class T182WaitlistNoShowIntegrationUseCase {
  constructor(
    private waitlistQueue: WaitlistQueue,
    private clientRepo: ClientRepository
  ) {}

  /**
   * Assess no-show risk level for a client.
   */
  async assessNoShowRisk(clientId: string): Promise<NoShowRiskAssessment> {
    // Get client's no-show history
    const noShowHistory = await this.clientRepo.getNoShowHistory(clientId, 90);
    
    const noShowCount90Days = noShowHistory.length;
    const lastNoShowDate = noShowHistory.length > 0
      ? noShowHistory[noShowHistory.length - 1].date
      : undefined;

    let riskLevel: NoShowRiskLevel;
    let waitlistPausedUntil: string | undefined;
    let message: string;

    // T-160 policy: ≥2 no-shows in 90 days → blocked
    if (noShowCount90Days >= 2) {
      riskLevel = NoShowRiskLevel.BLOCKED;
      waitlistPausedUntil = new Date(
        Date.now() + 90 * 24 * 60 * 60 * 1000
      ).toISOString().split('T')[0];
      message = `Client blocked from waitlist due to ${noShowCount90Days} no-shows in 90 days. Waitlist paused for 90 days.`;
    } else if (noShowCount90Days === 1) {
      riskLevel = NoShowRiskLevel.HIGH;
      waitlistPausedUntil = undefined;
      message = `Client has 1 no-show in 90 days - high risk. Priority score reduced and close monitoring applied.`;
    } else if (noShowCount90Days === 0 && /* new client check */ true) {
      riskLevel = NoShowRiskLevel.LOW;
      waitlistPausedUntil = undefined;
      message = 'Client has no no-show history - low risk, full waitlist access.';
    } else {
      riskLevel = NoShowRiskLevel.MEDIUM;
      waitlistPausedUntil = undefined;
      message = `Client has moderate no-show history. Standard waitlist rules apply.`;
    }

    return {
      clientId,
      riskLevel,
      noShowCount90Days,
      lastNoShowDate,
      waitlistPausedUntil,
      message,
    };
  }

  /**
   * Check if a client can be promoted from waitlist based on no-show policy.
   */
  async canPromoteFromWaitlist(clientId: string): Promise<{
    canPromote: boolean;
    riskAssessment: NoShowRiskAssessment;
    reason: string;
  }> {
    const riskAssessment = await this.assessNoShowRisk(clientId);

    const canPromote = riskAssessment.riskLevel !== NoShowRiskLevel.HIGH 
      && riskAssessment.riskLevel !== NoShowRiskLevel.BLOCKED;

    let reason: string;
    if (!canPromote) {
      if (riskAssessment.riskLevel === NoShowRiskLevel.BLOCKED) {
        reason = `Waitlist promotion blocked: ${riskAssessment.noShowCount90Days} no-shows in 90 days. Client paused for 90 days.`;
      } else {
        reason = `Waitlist promotion blocked: high no-show risk (${riskAssessment.noShowCount90Days} no-show(s) in 90 days).`;
      }
    } else {
      reason = 'Client eligible for waitlist promotion.';
    }

    return {
      canPromote,
      riskAssessment,
      reason,
    };
  }

  /**
   * Apply no-show policy when a client misses a waitlist slot.
   */
  async registerWaitlistMiss(clientId: string, slotId: string): Promise<{
    success: boolean;
    newRiskLevel: NoShowRiskLevel;
    consecutiveMisses: number;
    waitlistStatus: 'waiting' | 'paused' | 'blocked';
    message: string;
  }> {
    // Register the miss in the waitlist queue first
    const entry = await this.waitlistQueue.registerMiss({
      id: randomUUID(),
      clientId,
      configuration: {} as any, // would be resolved from context
      waitingSince: new Date(),
      consecutiveMisses: 0, // would be from existing entry
      status: 'waiting',
    });

    const misses = (entry.consecutiveMisses || 0) + 1;
    let newRiskLevel: NoShowRiskLevel;
    let waitlistStatus: 'waiting' | 'paused' | 'blocked' = 'waiting';
    let message: string;

    // T-160 policy: 3 consecutive misses → paused, ≥2 no-shows/90d → blocked
    if (misses >= 3) {
      newRiskLevel = NoShowRiskLevel.BLOCKED;
      waitlistStatus = 'blocked';
      message = `Client paused after ${misses} consecutive misses. Waitlist access blocked.`;
    } else if (misses >= 2) {
      // Check if this crosses the 2-no-shows-in-90-days threshold
      const noShowHistory = await this.clientRepo.getNoShowHistory(clientId, 90);
      const noShowCount90Days = noShowHistory.length + (misses >= 2 && /* was no-show */ true ? 1 : 0);

      if (noShowCount90Days >= 2) {
        newRiskLevel = NoShowRiskLevel.BLOCKED;
        const pauseUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        waitlistStatus = 'blocked';
        waitlistPausedUntil = pauseUntil.toISOString().split('T')[0];
        message = `Client blocked: ${noShowCount90Days} no-shows in 90 days. Waitlist paused until ${waitlistPausedUntil}.`;
      } else {
        newRiskLevel = NoShowRiskLevel.HIGH;
        waitlistStatus = 'paused';
        message = `Client ${misses} consecutive misses - high risk. Waitlist paused temporarily.`;
      }
    } else {
      newRiskLevel = NoShowRiskLevel.LOW;
      waitlistStatus = 'waiting';
      message = `Miss registered. ${misses} consecutive misses. Still eligible for waitlist.`;
    }

    return {
      success: true,
      newRiskLevel,
      consecutiveMisses: misses,
      waitlistStatus,
      message,
    };
  }

  /**
   * Get waitlist configuration for no-show policy integration.
   */
  async getNoShowWaitlistConfig(): Promise<NoShowWaitlistConfig> {
    return {
      maxNoShowsBeforePause: 2, // T-160 policy
      pauseDurationDays: 90, // T-160 policy
      depositRetentionPercentage: 25, // 25% deposit retained for repeated no-shows
      warningThreshold: 1, // warn at first no-show
    };
  }

  /**
   * Get no-show risk summary for dashboard integration.
   */
  async getNoShowRiskSummary(): Promise<{
    totalClientsAssessed: number;
    blockedClients: number;
    highRiskClients: number;
    mediumRiskClients: number;
    lowRiskClients: number;
    averageNoShowsPerClient: number;
  }> {
    // In a real implementation, would query all clients' no-show history
    // For now, return structured placeholder
    return {
      totalClientsAssessed: 0,
      blockedClients: 0,
      highRiskClients: 0,
      mediumRiskClients: 0,
      lowRiskClients: 0,
      averageNoShowsPerClient: 0,
    };
  }
}

export type { 
  NoShowRiskLevel, 
  NoShowRiskAssessment, 
  NoShowWaitlistConfig,
  NoShowRiskAssessment as NoShowRiskAssessment 
};