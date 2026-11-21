// Request/response DTOs for the T-5009 no-show propensity endpoints.
// Input DTOs carry validation decorators; output DTOs are concrete classes so
// @ApiResponse({ type: ... }) can describe them in Swagger.

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import type {
  NoShowPropensityFeatures,
  NoShowPropensityScore,
  NoShowRiskTier,
} from './domain/no-show-propensity.types';

export class ScoreAppointmentInput {
  @ApiProperty() @IsString() @IsNotEmpty() clientId: string;
  @ApiProperty() @IsDateString() appointmentStart: string;
}

export class DepositRequirementInput {
  @ApiProperty() @IsString() @IsNotEmpty() clientId: string;
  @ApiProperty() @IsDateString() appointmentStart: string;
  @ApiProperty() @IsInt() @Min(0) existingDepositPercent: number;
}

export class NoShowPropensityFeaturesOutput implements NoShowPropensityFeatures {
  @ApiProperty() lifetimeVisits: number;
  @ApiProperty() noShowCount90Days: number;
  @ApiProperty() cancellationCount90Days: number;
  @ApiProperty() leadHours: number;
  @ApiProperty() bookingsLast24h: number;
  @ApiProperty() visitFrequency30d: number;
  @ApiProperty() avgSpendPerVisit: number;
  @ApiProperty() deviceFingerprintEntropy: number;
  @ApiProperty() isNewEmailDomain: boolean;
  @ApiProperty() isCountryMismatch: boolean;
  @ApiProperty() isVpnOrProxy: boolean;
  @ApiProperty() isDatacenterIp: boolean;
}

export class NoShowPropensityScoreOutput implements NoShowPropensityScore {
  @ApiProperty() score: number;
  @ApiProperty() tier: NoShowRiskTier;
  @ApiProperty() requiresDepositHold: boolean;
  @ApiProperty() depositPercent: number;
  @ApiProperty({ type: [String] }) factors: string[];
  @ApiProperty() modelVersion: string;
  @ApiProperty() scoredAt: Date;
}

export class ScoredFeaturesOutput {
  @ApiProperty() score: NoShowPropensityScoreOutput;
  @ApiProperty() features: NoShowPropensityFeaturesOutput;
}

export class ScoreAppointmentOutput {
  @ApiProperty() success: boolean;
  @ApiPropertyOptional() data?: ScoredFeaturesOutput;
  @ApiPropertyOptional() error?: string;
}

export class DepositRequirementDataOutput {
  @ApiProperty() requiresDepositHold: boolean;
  @ApiProperty() depositPercent: number;
  @ApiProperty() score: NoShowPropensityScoreOutput;
  @ApiProperty({ type: [String] }) factors: string[];
}

export class DepositRequirementOutput {
  @ApiProperty() success: boolean;
  @ApiPropertyOptional() data?: DepositRequirementDataOutput;
  @ApiPropertyOptional() error?: string;
}

export class NoShowFeaturesOutput {
  @ApiProperty() success: boolean;
  @ApiPropertyOptional() data?: NoShowPropensityFeaturesOutput;
  @ApiPropertyOptional() error?: string;
}
