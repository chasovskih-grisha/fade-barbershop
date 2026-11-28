// Історія чату візиту (T-081): читає лише учасник. Список — хронологічний,
// обмежений CHAT_HISTORY_LIMIT; клієнт догружає давніші сторінки сам.
// Читання історії = доставка (T-4432): вхідні отримують `deliveredAt`, а
// кількість непрочитаних їде разом із відповіддю для бейджа.
import { Inject, Injectable } from '@nestjs/common';
import type { MessageSnapshot } from '../domain/conversation';
import { CONVERSATION_REPOSITORY, type ConversationRepository } from '../domain/ports';
import { CHAT_HISTORY_LIMIT, SendChatMessage } from './send-chat-message.use-case';

export type ChatHistory = {
  conversationId: string;
  visitId: string;
  clientId: string;
  barberId: string;
  messages: MessageSnapshot[];
  unreadCount: number;
};

@Injectable()
export class ListChatMessages {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: ConversationRepository,
    private readonly sender: SendChatMessage
  ) {}

  async execute(input: { visitId: string; userId: string }): Promise<ChatHistory> {
    const conversation = await this.sender.ensureConversation(input.visitId);
    conversation.assertParticipant(input.userId);
    await this.conversations.markDelivered(conversation.id, input.userId, new Date());
    const messages = await this.conversations.listMessages(conversation.id, CHAT_HISTORY_LIMIT);
    const unread = await this.conversations.unreadCounts(input.userId, [conversation.id]);
    return {
      conversationId: conversation.id,
      visitId: conversation.visitId,
      clientId: conversation.clientId,
      barberId: conversation.barberId,
      messages,
      unreadCount: unread[conversation.id] ?? 0,
    };
  }
}
