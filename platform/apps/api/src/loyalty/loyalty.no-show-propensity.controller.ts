// No-Show Propensity API (T-5009)
// Endpoints for no-show risk scoring and dynamic deposit enforcement

import { Body, Controller, Get, Post, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NoShowPropensityService } from './domain/no-show-propensity.service';

export interface ScoreAppointmentInput {
  clientId: string;
  appointmentStart: string; // ISO date string
}

export interface DepositRequirementInput {
  clientId: string;
  appointmentStart: string; // ISO date string
  existingDepositPercent: number;
}

export interface NoShowPropensityFeatures {
  /** Client lifetime visit count */
  lifetimeVisits: number;
  /** Client no-show count in rolling window (last 90 days) */
  noShowCount90Days: number;
  /** Client cancellation count in rolling window (last 90 days) */
  cancellationCount90Days: number;
  /** Booking lead time in hours */
  leadHours: number;
  /** Bookings in last 24h */
  bookingsLast24h: number;
  /** Visit frequency (visits per 30 days) */
  visitFrequency30d: number;
  /** Average spend per visit in UAH */
  avgSpendPerVisit: number;
  /** Device fingerprint entropy [0,1]; lower = more script-like */
  deviceFingerprintEntropy: number;
  /** Whether email domain is new (< 30 days old) */
  isNewEmailDomain: boolean;
  /** Whether IP/phone country mismatch */
  isCountryMismatch: boolean;
  /** Whether VPN/proxy detected */
  isVpnOrProxy: boolean;
  /** Whether datacenter IP */
  isDatacenterIp: boolean;
}

export interface ScoredFeatures {
  features: NoShowPropensityFeatures;
  score: import('./domain/no-show-propensity.service').NoShowPropensityScore;
}

@Controller('loyalty')
@ApiTags('loyalty')
export class NoShowPropensityController {
  constructor(private readonly propensityService: NoShowPropensityService) {}

  /** T-5009: Score an appointment for no-show propensity.
   *  Returns a risk score from 0.0 (low) to 1.0 (high) with risk tier and deposit requirements.
   */
  @Post('no-show-propensity/score')
  @ApiOperation({ summary: 'Score appointment for no-show propensity (T-5009)' })
  @ApiResponse({ status: 200, description: 'Return no-show risk score and recommendations' })
  async scoreAppointment(
    @Body() body: ScoreAppointmentInput
  ): Promise<{ success: boolean; data?: ScoredFeatures; error?: string }> {
    try {
      const { clientId, appointmentStart } = body;

      // Parse the appointment start time
      const startDate = new Date(appointmentStart);
      if (isNaN(startDate.getTime())) {
        return { success: false, error: 'Invalid appointmentStart date format' };
      }

      // Build features - in production these would come from a feature store
      // For now, use default features
      const features: NoShowPropensityFeatures = {
        lifetimeVisits: 0, // Would be fetched from client profile
        noShowCount90Days: 0, // Would be fetched from history
        cancellationCount90Days: 0, // Would be fetched from history
        leadHours: 0, // Would be calculated from current time vs appointment start
        bookingsLast24h: 0, // Would be fetched from booking history
        visitFrequency30d: 0, // Would be calculated from visit history
        avgSpendPerVisit: 0, // Would be fetched from loyalty transactions
        deviceFingerprintEntropy: 0.5, // Default medium entropy
        isNewEmailDomain: false, // Would be from client onboarding data
        isCountryMismatch: false, // Would be from IP geolocation vs phone country
        isVpnOrProxy: false, // Would be from IP analysis service
        isDatacenterIp: false, // Would be from IP analysis service
      };

      const score = this.propensityService.calculateNoShowPropensity(features);

      return {
        success: true,
        data: {
          score,
          features,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /** T-5009: Get deposit requirement based on no-show propensity.
   *  Determines if a deposit hold is required and at what percentage,
   *  overriding the standard policy based on ML risk assessment.
   */
  @Post('no-show-propensity/deposit-requirement')
  @ApiOperation({ summary: 'Get deposit requirement based on no-show propensity (T-5009)' })
  @ApiResponse({ status: 200, description: 'Return deposit hold requirement based on risk score' })
  async getDepositRequirement(
    @Body() body: DepositRequirementInput
  ): Promise<{ success: boolean; data?: { requiresDepositHold: boolean; depositPercent: number; score: import('./domain/no-show-propensity.service').NoShowPropensityScore; factors: string[] }; error?: string }> {
    try {
      const { clientId, appointmentStart, existingDepositPercent } = body;

      // Parse the appointment start time
      const startDate = new Date(appointmentStart);
      if (isNaN(startDate.getTime())) {
        return { success: false, error: 'Invalid appointmentStart date format' };
      }

      // Build features - in production these would come from a feature store
      const features: NoShowPropensityFeatures = {
        lifetimeVisits: 0,
        noShowCount90Days: 0,
        cancellationCount90Days: 0,
        leadHours: 0,
        bookingsLast24h: 0,
        visitFrequency30d: 0,
        avgSpendPerVisit: 0,
        deviceFingerprintEntropy: 0.5,
        isNewEmailDomain: false,
        isCountryMismatch: false,
        isVpnOrProxy: false,
        isDatacenterIp: false,
      };

      const score = this.propensityService.calculateNoShowPropensity(features);

      // Determine deposit based on score tier
      let depositPercent = 0;
      let requiresDepositHold = false;

      if (score.tier === 'HIGH') {
        depositPercent = 100;
        requiresDepositHold = true;
      } else if (score.tier === 'MEDIUM') {
        depositPercent = 50;
        requiresDepositHold = true;
      } else {
        depositPercent = 0;
        requiresDepositHold = false;
      }

      return {
        success: true,
        data: {
          requiresDepositHold,
          depositPercent,
          score,
          factors: score.factors,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /** T-5009: Get no-show propensity features for a client.
   *  Useful for admin dashboard and model monitoring.
   */
  @Get('no-show-propensity/features/:clientId')
  @ApiOperation({ summary: 'Get no-show propensity features for a client (T-5009)' })
  @ApiParam({ name: 'clientId', description: 'Client phone or ID' })
  @ApiResponse({ status: 200, description: 'Return client no-show propensity features' })
  async getFeatures(
    @Param('clientId') clientId: string
  ): Promise<{ success: boolean; data?: NoShowPropensityFeatures; error?: string }> {
    try {
      // Build default features - in production would fetch from feature store
      const features: NoShowPropensityFeatures = {
        lifetimeVisits: 0,
        noShowCount90Days: 0,
        cancellationCount90Days: 0,
        leadHours: 0,
        bookingsLast24h: 0,
        visitFrequency30d: 0,
        avgSpendPerVisit: 0,
        deviceFingerprintEntropy: 0.5,
        isNewEmailDomain: false,
        isCountryMismatch: false,
        isVpnOrProxy: false,
        isDatacenterIp: false,
      };

      return { success: true, data: features };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}