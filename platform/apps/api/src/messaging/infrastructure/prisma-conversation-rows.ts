// Мапінг рядків Prisma → домен (T-081). Винесено з репозиторію за LOC-гейтом:
// репозиторій лишає лише запити, тут — форми таблиць і конвертація.
import { Conversation, type MessageSnapshot, type ParticipantRole } from '../domain/conversation';

export type ConversationRow = {
  id: string;
  visitId: string;
  clientId: string;
  barberId: string;
  createdAt: Date;
  lastMessageAt: Date | null;
};

export type MessageRow = {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  body: string;
  clientMessageId: string | null;
  createdAt: Date;
  deliveredAt: Date | null;
  readAt: Date | null;
};

export const toConversation = (row: ConversationRow): Conversation =>
  Conversation.open({
    id: row.id,
    visitId: row.visitId,
    clientId: row.clientId,
    barberId: row.barberId,
    createdAt: row.createdAt,
    lastMessageAt: row.lastMessageAt,
  });

export const toMessage = (row: MessageRow): MessageSnapshot => ({
  id: row.id,
  conversationId: row.conversationId,
  senderId: row.senderId,
  senderRole: (row.senderRole === 'barber' ? 'barber' : 'client') as ParticipantRole,
  body: row.body,
  clientMessageId: row.clientMessageId,
  createdAt: row.createdAt,
  deliveredAt: row.deliveredAt,
  readAt: row.readAt,
});
