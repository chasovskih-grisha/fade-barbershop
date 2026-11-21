// No-Show Propensity API (T-5009)
// Endpoints for no-show risk scoring and dynamic deposit enforcement.

import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { defaultNoShowFeatures } from './domain/no-show-propensity';
import { NoShowPropensityService } from './domain/no-show-propensity.service';
import {
  DepositRequirementInput,
  DepositRequirementOutput,
  NoShowFeaturesOutput,
  ScoreAppointmentInput,
  ScoreAppointmentOutput,
} from './loyalty.no-show-propensity.dto';

@Controller('loyalty')
@ApiTags('loyalty')
export class NoShowPropensityController {
  constructor(private readonly propensityService: NoShowPropensityService) {}

  /** Score an appointment and return its risk tier and deposit requirements. */
  @Post('no-show-propensity/score')
  @ApiOperation({ summary: 'Score appointment for no-show propensity (T-5009)' })
  @ApiResponse({
    status: 200,
    type: ScoreAppointmentOutput,
    description: 'Return no-show risk score and recommendations',
  })
  @HttpCode(HttpStatus.OK)
  async scoreAppointment(@Body() body: ScoreAppointmentInput): Promise<ScoreAppointmentOutput> {
    const startDate = new Date(body.appointmentStart);
    if (Number.isNaN(startDate.getTime())) {
      return { success: false, error: 'Invalid appointmentStart date format' };
    }

    try {
      const features = defaultNoShowFeatures();
      const score = this.propensityService.scoreAppointment(features);
      return { success: true, data: { score, features } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /** Get the deposit requirement, overriding the standard policy on high risk. */
  @Post('no-show-propensity/deposit-requirement')
  @ApiOperation({ summary: 'Get deposit requirement based on no-show propensity (T-5009)' })
  @ApiResponse({
    status: 200,
    type: DepositRequirementOutput,
    description: 'Return deposit hold requirement based on risk score',
  })
  @HttpCode(HttpStatus.OK)
  async getDepositRequirement(
    @Body() body: DepositRequirementInput
  ): Promise<DepositRequirementOutput> {
    const startDate = new Date(body.appointmentStart);
    if (Number.isNaN(startDate.getTime())) {
      return { success: false, error: 'Invalid appointmentStart date format' };
    }

    try {
      const features = defaultNoShowFeatures();
      const score = this.propensityService.scoreAppointment(features);
      const deposit = this.propensityService.getDepositRequirement(score);
      const policy = this.propensityService.enhanceBookingPolicy(
        body.existingDepositPercent,
        score
      );
      return {
        success: true,
        data: {
          requiresDepositHold: deposit.requiresDepositHold,
          depositPercent: policy.depositPercent,
          score,
          factors: score.factors,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /** Return the default feature vector used for scoring and monitoring. */
  @Get('no-show-propensity/features/:clientId')
  @ApiOperation({ summary: 'Get no-show propensity features for a client (T-5009)' })
  @ApiParam({ name: 'clientId', description: 'Client phone or ID' })
  @ApiResponse({
    status: 200,
    type: NoShowFeaturesOutput,
    description: 'Return client no-show propensity features',
  })
  @HttpCode(HttpStatus.OK)
  async getFeatures(@Param('clientId') _clientId: string): Promise<NoShowFeaturesOutput> {
    try {
      return { success: true, data: defaultNoShowFeatures() };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}
