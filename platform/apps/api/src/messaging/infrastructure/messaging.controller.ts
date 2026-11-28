// HTTP-поверхня чату (T-081): історія та надсилання в межах візиту. Авторизація
// — клієнтська сесія (web-cookie або mobile Bearer), користувача беремо лише з
// неї; тіло не може назвати відправника. Health-роут GET /messaging лишається.
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ClientSessionGuard,
  clientSessionOf,
} from '../../identity/infrastructure/client-session.guard';
import { MessagingService } from '../application/messaging.service';
import { ListChatMessages } from '../application/list-chat-messages.use-case';
import { SendChatMessage } from '../application/send-chat-message.use-case';
import type { ChatMessageDto, SendChatMessageDto } from './messaging.dto';
import { toChatHttp } from './messaging-http.mapper';

@Controller('messaging')
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly sendMessage: SendChatMessage,
    private readonly listMessages: ListChatMessages
  ) {}

  @Get()
  getMessaging() {
    return this.messagingService.getStatus();
  }

  /** Розмови поточного користувача — вхід у чат із списку візитів. */
  @Get('conversations')
  @UseGuards(ClientSessionGuard)
  async conversations(@Req() req: Request) {
    const session = clientSessionOf(req);
    return this.messagingService.listMine(session!.userId);
  }

  /** Історія чату візиту; читає лише клієнт візиту або його барбер. */
  @Get('visits/:visitId/messages')
  @UseGuards(ClientSessionGuard)
  async history(@Req() req: Request, @Param('visitId') visitId: string) {
    const session = clientSessionOf(req);
    try {
      const history = await this.listMessages.execute({ visitId, userId: session!.userId });
      return { ...history, messages: history.messages.map(toDto) };
    } catch (error) {
      throw toChatHttp(error);
    }
  }

  /** Надіслати повідомлення; `clientMessageId` робить реплей офлайн-черги ідемпотентним. */
  @Post('visits/:visitId/messages')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ClientSessionGuard)
  async send(
    @Req() req: Request,
    @Param('visitId') visitId: string,
    @Body() dto: SendChatMessageDto
  ): Promise<{ conversationId: string; duplicate: boolean; message: ChatMessageDto }> {
    const session = clientSessionOf(req);
    try {
      const result = await this.sendMessage.execute({
        visitId,
        senderId: session!.userId,
        body: String(dto?.body ?? ''),
        clientMessageId: typeof dto?.clientMessageId === 'string' ? dto.clientMessageId : null,
      });
      return {
        conversationId: result.conversationId,
        duplicate: result.duplicate,
        message: toDto(result.message),
      };
    } catch (error) {
      throw toChatHttp(error);
    }
  }
}

const toDto = (message: {
  id: string;
  senderId: string;
  senderRole: 'client' | 'barber';
  body: string;
  clientMessageId: string | null;
  createdAt: Date;
  deliveredAt: Date | null;
  readAt: Date | null;
}): ChatMessageDto => ({
  id: message.id,
  senderId: message.senderId,
  senderRole: message.senderRole,
  body: message.body,
  clientMessageId: message.clientMessageId,
  createdAt: message.createdAt.toISOString(),
  deliveredAt: message.deliveredAt?.toISOString() ?? null,
  readAt: message.readAt?.toISOString() ?? null,
});
