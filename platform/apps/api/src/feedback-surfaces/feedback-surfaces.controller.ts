// Feedback Surfaces API — T-151: Feedback Surfaces.
// Клієнт: «Залишити відгук» / «Мої відгуки». Майстер: свої відгуки й середня.
// Адмін: список з фільтрами та відповідь. Публікація — фаза 25 (FDB-006).

import { Body, Controller, Get, Header, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminListInput, AdminReplyInput, CanSubmitInput } from './feedback-surfaces.dto';
import { FeedbackSurfacesService } from './feedback-surfaces.service';

@Controller('feedback-surfaces')
export class FeedbackSurfacesController {
  constructor(private readonly feedbackSurfacesService: FeedbackSurfacesService) {}

  /** Стан вікна для візиту (кабінет/мобільний). */
  @Get('appointment/:appointmentId')
  @ApiOperation({ summary: 'Get feedback window state for an appointment' })
  @ApiParam({ name: 'appointmentId' })
  @ApiQuery({ name: 'clientId', required: false })
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  async getWindow(
    @Param('appointmentId') appointmentId: string,
    @Query('clientId') clientId?: string
  ) {
    const [state, reviews] = await Promise.all([
      this.feedbackSurfacesService.canClientSubmit(clientId ?? '', appointmentId),
      this.feedbackSurfacesService.getAppointmentReviews(appointmentId),
    ]);

    return {
      success: true,
      data: {
        appointmentId,
        windowStatus: state.windowStatus,
        daysRemaining: state.daysRemaining,
        canSubmit: state.canSubmit,
        canEdit: state.canEdit,
        reason: state.reason,
        windowEndsAt: reviews.windowEndsAt,
        submission: reviews.submission ?? null,
      },
    };
  }

  /** «Мої відгуки» клієнта. */
  @Get('my-reviews')
  @ApiOperation({ summary: 'Get reviews submitted by a client' })
  @ApiQuery({ name: 'clientId' })
  @ApiQuery({ name: 'status', required: false })
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  async getMyReviews(
    @Query('clientId') clientId: string,
    @Query('status') status?: 'all' | 'active' | 'expired'
  ) {
    const result = await this.feedbackSurfacesService.getClientReviews(
      clientId,
      status ?? 'all'
    );

    return { success: true, data: result };
  }

  /** Відгуки майстра та його середня оцінка. */
  @Get('barber/:barberId')
  @ApiOperation({ summary: 'Get reviews of a barber’s visits and their average' })
  @ApiParam({ name: 'barberId' })
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  async getBarberReviews(@Param('barberId') barberId: string) {
    const result = await this.feedbackSurfacesService.getBarberReviews(barberId);
    return { success: true, data: result };
  }

  /** Чи може клієнт подати відгук. */
  @Post('can-submit')
  @ApiOperation({ summary: 'Check whether a client may submit feedback' })
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  async checkCanSubmit(@Body() body: CanSubmitInput) {
    const result = await this.feedbackSurfacesService.canClientSubmit(
      body.clientId,
      body.appointmentId
    );
    return { success: true, data: result };
  }

  /** Адмін: список відгуків з фільтрами та пагінацією. */
  @Get('admin/list')
  @ApiOperation({ summary: 'Admin: paginated feedback list with filters' })
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  async adminList(@Query() query: AdminListInput) {
    const filters: {
      status?: string;
      barberId?: string;
      clientId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {};
    if (query.status) filters.status = query.status;
    if (query.barberId) filters.barberId = query.barberId;
    if (query.clientId) filters.clientId = query.clientId;
    if (query.startDate) filters.startDate = new Date(query.startDate);
    if (query.endDate) filters.endDate = new Date(query.endDate);

    const result = await this.feedbackSurfacesService.adminListFeedback(filters, {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });

    return { success: true, data: result };
  }

  /** Адмін: відповідь на відгук. */
  @Post('admin/reply')
  @ApiOperation({ summary: 'Admin: reply to a review' })
  @HttpCode(HttpStatus.OK)
  async adminReply(@Body() body: AdminReplyInput) {
    const reply = await this.feedbackSurfacesService.adminReplyToReview(
      body.reviewId,
      body.adminId,
      body.replyText
    );
    return { success: true, data: reply };
  }
}
