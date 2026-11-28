// Позначити розмову прочитаною (T-4432): отримувач підтверджує, що бачив вхідні
// повідомлення. Читає лише учасник візиту; чужому візиту — 403 через той самий
// агрегат, що й історія. Повертаємо кількість змінених рядків, щоб клієнт знав,
// скільки повідомлень закрив бейдж.
import { Inject, Injectable } from '@nestjs/common';
import { CONVERSATION_REPOSITORY, type ConversationRepository } from '../domain/ports';
import { SendChatMessage } from './send-chat-message.use-case';

export type MarkConversationReadResult = {
  conversationId: string;
  visitId: string;
  readAt: string;
  markedRead: number;
};

@Injectable()
export class MarkConversationRead {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: ConversationRepository,
    private readonly sender: SendChatMessage
  ) {}

  async execute(input: { visitId: string; userId: string }): Promise<MarkConversationReadResult> {
    const conversation = await this.sender.ensureConversation(input.visitId);
    conversation.assertParticipant(input.userId);
    const readAt = new Date();
    const markedRead = await this.conversations.markRead(conversation.id, input.userId, readAt);
    return {
      conversationId: conversation.id,
      visitId: conversation.visitId,
      readAt: readAt.toISOString(),
      markedRead,
    };
  }
}
