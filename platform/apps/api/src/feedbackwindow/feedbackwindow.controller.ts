// Feedback Window API — T-150: Feedback Window.
// Subscription: AppointmentCompleted (outbox)
// Endpoints: GET /api/feedbackwindow/:appointmentId, POST /api/feedbackwindow/submit,
// POST /api/feedbackwindow/reminder

import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IdempotencyKey } from '../../shared/decorators/idempotency-key.decorator';
import { FeedbackWindowService } from './feedbackwindow.service';
import { type CreateFeedbackWindowInput, type SubmitFeedbackInput, FeedbackWindowOutput } from './feedbackwindow.dto';
import { IdempotencyKey } from '../../shared/decorators/idempotency-key.decorator';

export const FEEDBACKWINDOW_IO = Symbol('FEEDBACKWINDOW_IO');

export interface FeedbackWindowDeps {
  createFeedbackWindowIfNeeded: (
    appointmentId: string,
    clientId: string,
    locationId: string,
  ) => Promise<FeedbackWindowOutput>;
  submitFeedback: (windowId: string, rating: number, text: string, photoIds?: string[]) => Promise<any>;
  sendReminderIfNeeded: (windowId: string) => Promise<{ reminded: boolean; reminderSentAt: Date | null }>;
  getWindowForAppointment: (appointmentId: string) => Promise<FeedbackWindowOutput | null>;
}

@Controller('feedbackwindow')
@ApiTags('feedbackwindow')
export class FeedbackWindowController {
  constructor(private readonly feedbackWindowService: FeedbackWindowService) {}

  /** Subscription endpoint: called by outbox processor when appointment is completed.
   * Idempotent: checks appointmentId before creating window (ADR 0016).
   */
  @Post('subscribe')
  @ApiOperation({ summary: 'Create FeedbackWindow on AppointmentCompleted (outbox subscription)' })
  @ApiResponse({
    status: 201,
    type: FeedbackWindowOutput,
    description: 'Feedback window created; 30-day window opens for submissions',
  })
  @HttpCode(HttpStatus.CREATED)
  async subscribe(
    @Body('appointmentId') appointmentId: string,
    @Body('clientId') clientId: string,
    @Body('locationId') locationId: string,
  ): Promise<FeedbackWindowOutput> {
    return this.feedbackWindowService.createFeedbackWindowIfNeeded(
      appointmentId,
      clientId,
      locationId
    );
  }

  /** Submit feedback within the 30-day window. */
  @Post('submit')
  @ApiOperation({ summary: 'Submit feedback (rating, text, photos)' })
  @ApiResponse({
    status: 200,
    type: FeedbackWindowOutput,
    description: 'Feedback submitted; window closed after submission',
  })
  @HttpCode(HttpStatus.OK)
  async submitFeedback(
    @Body() body: SubmitFeedbackInput,
  ): Promise<FeedbackWindowOutput> {
    // The service handles submission; controller returns window state
    await this.feedbackWindowService.submitFeedback(
      body.windowId,
      body.rating,
      body.text,
      body.photoIds
    );

    // Return updated window state
    return this.feedbackWindowService.getWindowForAppointment(body.windowId) || {
      id: body.windowId,
      appointmentId: body.windowId,
      clientId: '',
      locationId: '',
      openedAt: new Date(),
      windowEndsAt: new Date(),
      status: 'closed',
      submission: undefined,
      reminderSent: false,
      daysRemaining: 0,
    };
  }

  /** Send reminder after exactly 2 hours if feedback not yet submitted (FDB-MOB-02). */
  @Post('reminder')
  @ApiOperation({ summary: 'Send reminder if 2h elapsed and feedback not submitted' })
  @ApiResponse({
    status: 200,
    type: FeedbackWindowOutput,
    description: 'Reminder sent or skipped; window state returned',
  })
  @HttpCode(HttpStatus.OK)
  async sendReminderIfNeeded(
    @Body('windowId') windowId: string,
  ): Promise<{ reminded: boolean; reminderSentAt: Date | null }> {
    return this.feedbackWindowService.sendReminderIfNeeded(windowId);
  }

  /** Get feedback window state for an appointment. */
  @Get(':appointmentId')
  @ApiOperation({ summary: 'Get feedback window state for appointment' })
  @ApiParam({ name: 'appointmentId', description: 'Appointment ID' })
  @ApiResponse({
    status: 200,
    type: FeedbackWindowOutput,
    description: 'Return feedback window state, days remaining, submission status',
  })
  @HttpCode(HttpStatus.OK)
  async getWindow(
    @Param('appointmentId') appointmentId: string,
  ): Promise<FeedbackWindowOutput> {
    return this.feedbackWindowService.getWindowForAppointment(appointmentId) || {
      id: appointmentId,
      appointmentId,
      clientId: '',
      locationId: '',
      openedAt: new Date(),
      windowEndsAt: new Date(),
      status: 'expired',
      submission: undefined,
      reminderSent: false,
      daysRemaining: 0,
    };
  }
}