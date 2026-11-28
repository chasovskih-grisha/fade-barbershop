// HTTP-поверхня позначок чату (T-4432): отримувач підтверджує прочитання
// розмови, бейдж непрочитаних падає. Окремий контролер, а не метод у
// MessagingController: файл історії вже на межі LOC-гейта (ADR 0019).
import { Controller, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  ClientSessionGuard,
  clientSessionOf,
} from '../../identity/infrastructure/client-session.guard';
import {
  MarkConversationRead,
  type MarkConversationReadResult,
} from '../application/mark-conversation-read.use-case';
import { MessagingService } from '../application/messaging.service';
import { toChatHttp } from './messaging-http.mapper';

@Controller('messaging')
export class MessagingReceiptController {
  constructor(
    private readonly markRead: MarkConversationRead,
    private readonly messaging: MessagingService
  ) {}

  /** Бейдж шапки: скільки вхідних повідомлень ще не прочитано (обидві ролі). */
  @Get('unread')
  @UseGuards(ClientSessionGuard)
  async unread(@Req() req: Request): Promise<{ unreadCount: number }> {
    const session = clientSessionOf(req);
    return this.messaging.unreadTotal(session!.userId);
  }

  /** Клієнт або барбер візиту: усі вхідні розмови прочитано. */
  @Post('visits/:visitId/read')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClientSessionGuard)
  async read(
    @Req() req: Request,
    @Param('visitId') visitId: string
  ): Promise<MarkConversationReadResult> {
    const session = clientSessionOf(req);
    try {
      return await this.markRead.execute({ visitId, userId: session!.userId });
    } catch (error) {
      throw toChatHttp(error);
    }
  }
}
