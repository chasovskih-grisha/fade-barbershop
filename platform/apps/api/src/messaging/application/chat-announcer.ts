// Оголошення нового повідомлення чату (T-081d): outbox-подія для push-релея і
// публікація в живий стрім — одна відповідальність, тож use case надсилання
// не тягне четвертий параметр (ADR 0019, max-params 3).
import { Inject, Injectable } from '@nestjs/common';
import type { MessageSnapshot } from '../domain/conversation';
import { MESSAGE_CREATED_EVENT, MESSAGING_OUTBOX, type MessagingOutbox } from '../domain/ports';
import { ChatStream } from './chat-stream';

const PREVIEW_LENGTH = 120;

@Injectable()
export class ChatAnnouncer {
  constructor(
    @Inject(MESSAGING_OUTBOX) private readonly outbox: MessagingOutbox,
    private readonly stream: ChatStream
  ) {}

  async announce(
    conversationId: string,
    message: MessageSnapshot,
    recipientId: string
  ): Promise<void> {
    await this.outbox.append([
      {
        type: MESSAGE_CREATED_EVENT,
        aggregateId: conversationId,
        payload: {
          conversationId,
          messageId: message.id,
          recipientId,
          senderRole: message.senderRole,
          preview: message.body.slice(0, PREVIEW_LENGTH),
        },
      },
    ]);
    this.stream.publish(conversationId, message);
  }
}
