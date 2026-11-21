// Loyalty API — T-140: Loyalty Counter, T-4450: Loyalty Program Configuration.
// Events: AppointmentCompleted (outbox subscription)
// Endpoints: GET /api/loyalty/progress/:clientId, POST /api/loyalty/threshold,
//   GET/POST /api/loyalty/config, PUT /api/loyalty/config/:id

import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import {
  GetProgressOutput,
  type SetThresholdInput,
  ThresholdOutput,
  type LoyaltyProgramConfig,
} from './loyalty.dto';

export const LOYALTY_IO = Symbol('LOYALTY_IO');

export interface LoyaltyDeps {
  processAppointmentCompleted: (
    appointmentId: string,
    clientId: string
  ) => Promise<GetProgressOutput>;
  setThreshold: (input: SetThresholdInput) => Promise<ThresholdOutput>;
  getProgress: (clientId: string) => Promise<GetProgressOutput>;
  getConfig: () => Promise<{ success: boolean; data: LoyaltyProgramConfig }>;
  setConfig: (
    config: Partial<LoyaltyProgramConfig>
  ) => Promise<{ success: boolean; data: LoyaltyProgramConfig }>;
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
    @Body('clientId') clientId: string
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
  async setThreshold(@Body() body: SetThresholdInput): Promise<ThresholdOutput> {
    return this.loyaltyService.setThreshold(body);
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
  async getProgress(@Param('clientId') clientId: string): Promise<GetProgressOutput> {
    return this.loyaltyService.getProgress(clientId);
  }

  /** T-4450: Get loyalty program configuration.
   * Returns the active configuration for the default/first program.
   */
  @Get('config')
  @ApiOperation({ summary: 'Get loyalty program configuration' })
  @ApiResponse({
    status: 200,
    description: 'Return the active loyalty program configuration',
  })
  @HttpCode(HttpStatus.OK)
  async getConfig(): Promise<{ success: boolean; data: LoyaltyProgramConfig }> {
    return this.loyaltyService.getConfig();
  }

  /** T-4450: Set loyalty program configuration.
   * Admin: sets/updates the active loyalty program configuration.
   * Applied to future accruals; old points retain their terms.
   */
  @Post('config')
  @ApiOperation({ summary: 'Set loyalty program configuration' })
  @ApiResponse({
    status: 200,
    description: 'Set the active loyalty program configuration',
  })
  @HttpCode(HttpStatus.OK)
  async setConfig(
    @Body() body: Partial<LoyaltyProgramConfig>
  ): Promise<{ success: boolean; data: LoyaltyProgramConfig }> {
    const result = await this.loyaltyService.setConfig(body);
    return {
      success: result.success,
      data: result.data,
    };
  }
}
