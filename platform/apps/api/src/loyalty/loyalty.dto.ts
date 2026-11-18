import { Type, IsOptional } from '@nestjs/common';
import { IdempotencyKey } from '../shared/decorators/idempotency-key.decorator';

// Loyalty progress output DTO
export class LoyaltyProgressOutput {
  currentVisits: number;
  threshold: number;
  progressPercentage: number;
  nextFreeVisitAt: number;
  isMilestoneReached: boolean;
  freeVisitGranted: boolean;
}

// Get progress output DTO
export class GetProgressOutput {
  success: boolean;
  data: {
    currentVisits: number;
    threshold: number;
    progressPercentage: number;
    nextFreeVisitAt: number;
    isMilestoneReached: boolean;
    freeVisitGranted: boolean;
    clientId: string;
    lastUpdated: Date;
  };
}

// Set threshold input DTO
export class SetThresholdInput {
  @IdempotencyKey()
  threshold: number;
  adminId: string;
}

// Set threshold output DTO
export class ThresholdOutput {
  success: boolean;
  data: {
    threshold: number;
    adminId: string;
    timestamp: string;
  };
}