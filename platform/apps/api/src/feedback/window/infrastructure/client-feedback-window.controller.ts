// Клієнтська поверхня вікна відгуку (T-150): клієнт бачить своє вікно і подає
// відгук. Користувача беремо лише з сесії — тіло не може назвати власника.
import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  ClientSessionGuard,
  clientSessionOf,
} from '../../../identity/infrastructure/client-session.guard';
import { FeedbackWindowService } from '../application/feedback-window.service';
import type { FeedbackWindowView } from '../domain/feedback-window';
import { toFeedbackWindowHttp } from './feedback-window-http.mapper';

export type SubmitFeedbackDto = { rating?: unknown; text?: unknown; photoIds?: unknown };

@Controller('feedback/window')
export class ClientFeedbackWindowController {
  constructor(private readonly windows: FeedbackWindowService) {}

  @Get(':appointmentId')
  @UseGuards(ClientSessionGuard)
  async view(@Req() req: Request, @Param('appointmentId') appointmentId: string) {
    const session = clientSessionOf(req);
    try {
      return await this.windows.viewFor(appointmentId, session!.userId);
    } catch (error) {
      throw toFeedbackWindowHttp(error);
    }
  }

  @Post(':appointmentId')
  @UseGuards(ClientSessionGuard)
  async submit(
    @Req() req: Request,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: SubmitFeedbackDto
  ): Promise<FeedbackWindowView> {
    const session = clientSessionOf(req);
    try {
      return await this.windows.submit({
        appointmentId,
        userId: session!.userId,
        rating: Number(dto?.rating),
        text: String(dto?.text ?? ''),
        photoIds: Array.isArray(dto?.photoIds) ? (dto.photoIds as string[]) : [],
      });
    } catch (error) {
      throw toFeedbackWindowHttp(error);
    }
  }
}
