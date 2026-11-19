// Feedback Surfaces API — T-151: Feedback Surfaces.
// Клієнт: «Залишити відгук» / «Мої відгуки». Майстер: свої відгуки й середня.
// Адмін: список з фільтрами та відповідь. Публікація — фаза 25 (FDB-006).

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  AdminListInput,
  AdminReplyInput,
  CanSubmitInput,
  RevaluationCloseBody,
  RevaluationRateBody,
  ReviewReplyBody,
  ReviewStatusBody,
  ShowcaseModerationBody,
} from './feedback-surfaces.dto';
import { FeedbackSurfacesService } from './feedback-surfaces.service';
import { ReviewProcessingService } from './review-processing.service';
import { ReviewRevaluationService } from './review-revaluation.service';

@Controller('feedback-surfaces')
export class FeedbackSurfacesController {
  constructor(
    private readonly feedbackSurfacesService: FeedbackSurfacesService,
    private readonly reviewProcessing: ReviewProcessingService,
    private readonly reviewRevaluation: ReviewRevaluationService
  ) {}

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

  // ─── T-4451: опрацювання відгуків ────────────────────────────────────────

  /** Черга «неопрацьовані» для підтримки (найстаріші спершу). */
  @Get('admin/reviews/unprocessed')
  @ApiOperation({ summary: 'Admin: reviews awaiting the first reply, oldest first' })
  @ApiQuery({ name: 'limit', required: false })
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  async unprocessedReviews(@Query('limit') limit?: string) {
    const parsed = limit === undefined ? undefined : Number.parseInt(limit, 10);
    const safeLimit = parsed === undefined || Number.isNaN(parsed) ? undefined : parsed;
    const items = await this.reviewProcessing.listUnprocessed(safeLimit);
    return { success: true, data: { total: items.length, reviews: items } };
  }

  /** Публічна відповідь адміна; переводить відгук у «опрацьований». */
  @Post('admin/reviews/:reviewId/reply')
  @ApiOperation({ summary: 'Admin: reply to a review and mark it processed' })
  @ApiParam({ name: 'reviewId' })
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  async replyToReview(@Param('reviewId') reviewId: string, @Body() body: ReviewReplyBody) {
    try {
      const result = await this.reviewProcessing.reply(reviewId, {
        adminId: body.adminId,
        text: body.text,
      });
      return { success: true, data: result };
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }

  /** Перемикання статусу: новий / опрацьований / архів. */
  @Patch('admin/reviews/:reviewId/status')
  @ApiOperation({ summary: 'Admin: move a review between new / processed / archived' })
  @ApiParam({ name: 'reviewId' })
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  async setReviewStatus(@Param('reviewId') reviewId: string, @Body() body: ReviewStatusBody) {
    try {
      const review = await this.reviewProcessing.setStatus(reviewId, body.status, body.actorId);
      return { success: true, data: review };
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }

  // ─── T-4463: закритий цикл відгуку ───────────────────────────────────────

  /** Клієнт змінює/покращує оцінку, поки цикл не закрито. */
  @Post('client/reviews/:reviewId/revaluation')
  @ApiOperation({ summary: 'Client: improve or edit a review rating' })
  @ApiParam({ name: 'reviewId' })
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  async rateReview(@Param('reviewId') reviewId: string, @Body() body: RevaluationRateBody) {
    try {
      const review = await this.reviewRevaluation.rate(reviewId, {
        rating: body.rating,
        text: body.text,
      });
      return { success: true, data: review };
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }

  /** Адмін відповів: за низької оцінки клієнта питаємо про покращення один раз. */
  @Post('admin/reviews/:reviewId/revaluation/reply')
  @ApiOperation({ summary: 'Admin: record a reply and queue a re-rating prompt if needed' })
  @ApiParam({ name: 'reviewId' })
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  async recordRevaluationReply(@Param('reviewId') reviewId: string) {
    try {
      return { success: true, data: await this.reviewRevaluation.onAdminReply(reviewId) };
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }

  /** Закриття циклу: оцінка фінальна. */
  @Post('admin/reviews/:reviewId/revaluation/close')
  @ApiOperation({ summary: 'Admin: close the review loop' })
  @ApiParam({ name: 'reviewId' })
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  async closeReviewLoop(@Param('reviewId') reviewId: string, @Body() body: RevaluationCloseBody) {
    try {
      return { success: true, data: await this.reviewRevaluation.close(reviewId, body.actorId) };
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }

  /** Модерація запису для публічної вітрини (4–5★, перевірений текст). */
  @Post('admin/reviews/:reviewId/revaluation/showcase')
  @ApiOperation({ summary: 'Admin: approve or reject a review for the public showcase' })
  @ApiParam({ name: 'reviewId' })
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  async moderateReviewShowcase(
    @Param('reviewId') reviewId: string,
    @Body() body: ShowcaseModerationBody
  ) {
    try {
      const review = await this.reviewRevaluation.moderate(reviewId, body);
      return { success: true, data: review };
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }

  /** Публічна проєкція вітрини: лише схвалені модерацією записи. */
  @Get('showcase')
  @ApiOperation({ summary: 'Public: moderated reviews for the showcase page' })
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'public, max-age=60')
  async publicShowcase() {
    const reviews = await this.reviewRevaluation.showcase();
    return { success: true, data: { total: reviews.length, reviews } };
  }

  /** Зведення циклу для адмін-звіту «було → стало». */
  @Get('admin/reviews/:reviewId/revaluation')
  @ApiOperation({ summary: 'Admin: re-rating summary for one review' })
  @ApiParam({ name: 'reviewId' })
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  async reviewRevaluationSummary(@Param('reviewId') reviewId: string) {
    try {
      return { success: true, data: await this.reviewRevaluation.summary(reviewId) };
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }

  /** Охоплення SLA: неопрацьовані, прострочені, найдовше очікування. */
  @Get('admin/reviews/sla')
  @ApiOperation({ summary: 'Admin: review-processing SLA summary' })
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  async reviewSla() {
    return { success: true, data: await this.reviewProcessing.sla() };
  }
}
