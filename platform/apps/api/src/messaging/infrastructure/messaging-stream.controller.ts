// SSE-стрім чату візиту (T-081d): клієнт тримає EventSource і отримує нові
// повідомлення без перезапиту історії. Право читати те саме, що в історії —
// учасника перевіряємо до відкриття потоку, тож чужий візит дає 403, а не
// порожній стрім. Окремий контролер, а не ще один метод у MessagingController:
// файл історії вже на межі LOC-гейта (ADR 0019).
import {
  Controller,
  Param,
  Req,
  Sse,
  UnauthorizedException,
  UseGuards,
  type MessageEvent,
} from '@nestjs/common';
import type { Request } from 'express';
import { map, type Observable } from 'rxjs';
import {
  ClientSessionGuard,
  clientSessionOf,
} from '../../identity/infrastructure/client-session.guard';
import { ChatStream } from '../application/chat-stream';
import { ListChatMessages } from '../application/list-chat-messages.use-case';
import type { MessageSnapshot } from '../domain/conversation';
import type { ChatStreamEvent } from './messaging.dto';
import { toChatHttp } from './messaging-http.mapper';

/** Ім'я SSE-події, яку слухає EventSource у клієнті (addEventListener). */
export const CHAT_MESSAGE_EVENT = 'message';

@Controller('messaging')
export class MessagingStreamController {
  constructor(
    private readonly history: ListChatMessages,
    private readonly stream: ChatStream
  ) {}

  @Sse('visits/:visitId/stream')
  @UseGuards(ClientSessionGuard)
  async messages(
    @Req() req: Request,
    @Param('visitId') visitId: string
  ): Promise<Observable<MessageEvent>> {
    const userId = clientSessionOf(req)?.userId;
    if (!userId) throw new UnauthorizedException('Client session required');
    const conversationId = await this.conversationOf(visitId, userId);
    return this.stream
      .stream(conversationId)
      .pipe(map((message) => ({ type: CHAT_MESSAGE_EVENT, data: toStreamEvent(message) })));
  }

  private async conversationOf(visitId: string, userId: string): Promise<string> {
    try {
      const history = await this.history.execute({ visitId, userId });
      return history.conversationId;
    } catch (error) {
      throw toChatHttp(error);
    }
  }
}

const toStreamEvent = (message: MessageSnapshot): ChatStreamEvent => ({
  id: message.id,
  senderRole: message.senderRole,
  body: message.body,
  createdAt: message.createdAt.toISOString(),
  clientMessageId: message.clientMessageId,
});
