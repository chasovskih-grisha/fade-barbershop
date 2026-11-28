// Сервіс контексту messaging (T-081). Тримає лічильник здоров'я контексту і
// список розмов користувача — дешевий вхід у чат без історії повідомлень.
import { Inject, Injectable } from '@nestjs/common';
import type { Conversation } from '../domain/conversation';
import {
  CONVERSATION_REPOSITORY,
  type ConversationRepository,
  type ConversationSummary,
} from '../domain/ports';

export const CONVERSATION_LIST_LIMIT = 50;

@Injectable()
export class MessagingService {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: ConversationRepository
  ) {}

  getStatus() {
    return { status: 'ok', context: 'messaging' };
  }

  /** Усього непрочитаних — бейдж шапки застосунку (клієнт і барбер однаково). */
  async unreadTotal(userId: string): Promise<{ unreadCount: number }> {
    return { unreadCount: await this.conversations.unreadTotal(userId) };
  }

  /** Розмови, де користувач клієнт або барбер; новіші зверху, не більше 50. */
  async listMine(userId: string): Promise<{ conversations: ConversationSummary[] }> {
    const rows = await this.conversations.listForUser(userId, CONVERSATION_LIST_LIMIT);
    const unread = await this.conversations.unreadCounts(
      userId,
      rows.map((row) => row.id)
    );
    return { conversations: rows.map((row) => toSummary(row, unread[row.id] ?? 0)) };
  }
}

const toSummary = (conversation: Conversation, unreadCount: number): ConversationSummary => ({
  conversationId: conversation.id,
  visitId: conversation.visitId,
  clientId: conversation.clientId,
  barberId: conversation.barberId,
  lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
  unreadCount,
});
