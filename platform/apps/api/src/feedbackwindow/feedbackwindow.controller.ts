// Feedback Window API — T-150: Feedback Window.
// Підписка: AppointmentCompleted (outbox, ідемпотентно — ADR 0016).
// Endpoints: POST /api/feedbackwindow/subscribe, POST /api/feedbackwindow/submit,
//            POST /api/feedbackwindow/reminder, GET /api/feedbackwindow/:appointmentId

import { Body, Controller, Get, Header, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FeedbackWindowService } from './feedbackwindow.service';
import { SubmitFeedbackInput } from './feedbackwindow.dto';
import type { FeedbackWindowOutput } from './feedbackwindow.domain';

@Controller('feedbackwindow')
@ApiTags('feedbackwindow')
export class FeedbackWindowController {
  constructor(private readonly feedbackWindowService: FeedbackWindowService) {}

  /** Підписка на AppointmentCompleted: створює вікно один раз на візит. */
  @Post('subscribe')
  @ApiOperation({ summary: 'Create FeedbackWindow on AppointmentCompleted (outbox subscription)' })
  @ApiResponse({ status: 201, description: 'created=true лише для першого візиту' })
  @HttpCode(HttpStatus.CREATED)
  async subscribe(
    @Body('appointmentId') appointmentId: string,
    @Body('clientId') clientId: string,
    @Body('locationId') locationId: string
  ): Promise<{ success: boolean; created: boolean; data: FeedbackWindowOutput | null }> {
    const result = await this.feedbackWindowService.createFeedbackWindowIfNeeded(
      appointmentId,
      clientId,
      locationId
    );
    return { success: true, created: result.created, data: result.window };
  }

  /** Подання відгуку в межах 30-денного вікна (повторне — редагування, FDB-002). */
  @Post('submit')
  @ApiOperation({ summary: 'Submit or edit feedback (rating, text, photos)' })
  @HttpCode(HttpStatus.OK)
  async submitFeedback(@Body() body: SubmitFeedbackInput): Promise<{
    success: boolean;
    data: { submissionId: string };
  }> {
    const submission = await this.feedbackWindowService.submitFeedback(
      body.windowId,
      body.rating,
      body.text,
      body.photoIds ?? []
    );
    return { success: true, data: { submissionId: submission.id } };
  }

  /** Нагадування через 2 години, рівно одне (FDB-MOB-02). */
  @Post('reminder')
  @ApiOperation({ summary: 'Send reminder if 2h elapsed and feedback not submitted' })
  @HttpCode(HttpStatus.OK)
  async sendReminderIfNeeded(@Body('windowId') windowId: string): Promise<{
    success: boolean;
    data: { reminded: boolean; reminderSentAt: Date | null };
  }> {
    const result = await this.feedbackWindowService.sendReminderIfNeeded(windowId);
    return { success: true, data: result };
  }

  /** Стан вікна для візиту. */
  @Get(':appointmentId')
  @ApiOperation({ summary: 'Get feedback window state for an appointment' })
  @ApiParam({ name: 'appointmentId' })
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  async getWindow(@Param('appointmentId') appointmentId: string): Promise<{
    success: boolean;
    data: FeedbackWindowOutput | null;
  }> {
    const window = await this.feedbackWindowService.getWindowForAppointment(appointmentId);
    return { success: true, data: window };
  }
}
