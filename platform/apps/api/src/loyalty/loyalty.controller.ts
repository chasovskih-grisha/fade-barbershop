// Loyalty API — T-140: Loyalty Counter.
// Events: AppointmentCompleted (outbox subscription)
// Endpoints: GET /api/loyalty/progress/:clientId, POST /api/loyalty/threshold

import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IdempotencyKey } from '../shared/decorators/idempotency-key.decorator';
import { LoyaltyService } from './loyalty.service';
import { GetProgressOutput, type SetThresholdInput, ThresholdOutput } from './loyalty.dto';
import { IdempotencyKey } from '../shared/decorators/idempotency-key.decorator';

export const LOYALTY_IO = Symbol('LOYALTY_IO');

export interface LoyaltyDeps {
  processAppointmentCompleted: (appointmentId: string, clientId: string) => Promise<GetProgressOutput>;
  setThreshold: (input: SetThresholdInput) => Promise<ThresholdOutput>;
  getProgress: (clientId: string) => Promise<GetProgressOutput>;
}

@Controller('loyalty')
@ApiTags('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  /** Subscription endpoint: called by outbox processor when appointment is completed.
   * Idempotent: checks appointmentId before incrementing counter.
   */
  @Post('process-appointment-completed')
  @ApiOperation({ summary: 'Process AppointmentCompleted event (outbox subscription)' })
  @ApiResponse({
    status: 200,
    type: GetProgressOutput,
    description: 'Increment loyalty counter for completed appointment',
  })
  @HttpCode(HttpStatus.OK)
  async processAppointmentCompleted(
    @Body('appointmentId') appointmentId: string,
    @Body('clientId') clientId: string,
  ): Promise<GetProgressOutput> {
    return this.loyaltyService.processAppointmentCompleted(appointmentId, clientId);
  }

  /** Admin: set loyalty threshold (LYL-ADM-01).
   * Configures visit count required for free visit grant.
   * Default is 7, admin can change.
   */
  @Post('threshold')
  @ApiOperation({ summary: 'Set loyalty visit threshold' })
  @ApiResponse({
    status: 200,
    type: ThresholdOutput,
    description: 'Set the threshold for free visit grant',
  })
  @HttpCode(HttpStatus.OK)
  async setThreshold(
    @Body() body: SetThresholdInput,
  ): Promise<ThresholdOutput> {
    const result = await this.loyaltyService.setThreshold(body.threshold, body.adminId);
    return {
      success: true,
      data: {
        threshold: result.threshold,
        adminId: result.adminId,
        timestamp: result.timestamp,
      },
    };
  }

  /** Get client loyalty progress */
  @Get('progress/:clientId')
  @ApiOperation({ summary: 'Get client loyalty progress' })
  @ApiParam({ name: 'clientId', description: 'Client phone or ID' })
  @ApiResponse({
    status: 200,
    type: GetProgressOutput,
    description: 'Return client loyalty progress and milestone status',
  })
  @HttpCode(HttpStatus.OK)
  async getProgress(
    @Param('clientId') clientId: string,
  ): Promise<GetProgressOutput> {
    return this.loyaltyService.getProgress(clientId);
  }
}