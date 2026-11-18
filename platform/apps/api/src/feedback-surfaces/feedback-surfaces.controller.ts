// Feedback Surfaces API — T-151: Feedback Surfaces.

import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IdempotencyKey } from '../../shared/decorators/idempotency-key.decorator';
import { FeedbackSurfacesService } from './feedback-surfaces.service';
import { CanSubmitInput, AdminListInput } from './feedback-surfaces.dto';

@Controller('feedback-surfaces')
@ApiTags('feedback-surfaces')
export class FeedbackSurfacesController {
  constructor(private readonly feedbackSurfacesService: FeedbackSurfacesService) {}

  /** Get feedback window state for an appointment (cabinet/mobile). */
  @Get(':appointmentId')
  @ApiOperation({ summary: 'Get feedback window state for appointment' })
  @ApiParam({ name: 'appointmentId', description: 'Appointment ID' })
  @ApiResponse({
    status: 200,
    description: 'Return window state, canSubmit, days remaining',
  })
  @HttpCode(HttpStatus.OK)
  async getWindow(
    @Param('appointmentId') appointmentId: string,
  ) {
    const result = await this.feedbackSurfacesService.canClientSubmit(
      '',
      appointmentId
    );

    return {
      success: true,
      data: {
        appointmentId,
        windowStatus: result.windowStatus,
        daysRemaining: result.daysRemaining,
        canSubmit: result.canSubmit,
        reason: result.reason,
      },
    };
  }

  /** Get my reviews (client cabinents). */
  @Get('my-reviews')
  @ApiOperation({ summary: 'Get client\'s submitted reviews (My Reviews)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({
    status: 200,
    description: 'Return client\'s submitted reviews',
  })
  @HttpCode(HttpStatus.OK)
  async getMyReviews(
    @Query('status') status?: string,
  ) {
    const result = await this.feedbackSurfacesService.getClientReviews('', status || 'all');

    return {
      success: true,
      data: {
        totalCount: result.totalCount,
        submissions: result.submissions,
      },
    };
  }

  /** Check if client can submit feedback for an appointment. */
  @Post('can-submit')
  @ApiOperation({ summary: 'Check if client can submit feedback' })
  @ApiResponse({
    status: 200,
    description: 'Return whether client can submit feedback and why',
  })
  @HttpCode(HttpStatus.OK)
  async checkCanSubmit(
    @Body() body: CanSubmitInput,
  ) {
    const result = await this.feedbackSurfacesService.canClientSubmit(
      body.clientId,
      body.appointmentId
    );

    return {
      success: true,
      data: {
        canSubmit: result.canSubmit,
        reason: result.reason,
        daysRemaining: result.daysRemaining,
        windowStatus: result.windowStatus,
      },
    };
  }

  /** Admin: list all feedback submissions with filters. */
  @Post('admin/list')
  @ApiOperation({ summary: 'Admin list feedback submissions with filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'barberId', required: false })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiResponse({
    status: 200,
    description: 'Return paginated feedback submissions list',
  })
  @HttpCode(HttpStatus.OK)
  async adminList(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('barberId') barberId?: string,
    @Query('clientId') clientId?: string,
  ) {
    const filters: AdminListInput = {
      status,
      barberId,
      clientId,
      startDate: undefined,
      endDate: undefined,
    };

    const pagination = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    };

    const result = await this.feedbackSurfacesService.adminListFeedback(
      filters,
      pagination
    );

    return {
      success: true,
      data: result,
    };
  }

  /** Admin: reply to a review. */
  @Post('admin/reply')
  @ApiOperation({ summary: 'Admin reply to a review' })
  @ApiResponse({
    status: 200,
    description: 'Return admin reply record',
  })
  @HttpCode(HttpStatus.OK)
  async adminReply(
    @Body() body: { reviewId: string; adminId: string; replyText: string },
  ) {
    // Service call - result handled by service
    await this.feedbackSurfacesService.adminReplyToReview(
      body.reviewId,
      body.adminId,
      body.replyText
    );

    return {
      success: true,
    };
  }
}