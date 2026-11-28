// Prisma-адаптер розмов і повідомлень (T-081). Домен лишається чистим, тут лише
// мапінг рядків. `saveMessage` ловить унікальний індекс пари
// (conversationId, clientMessageId): паралельний реплей офлайн-черги — duplicate.
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Conversation, type MessageSnapshot } from '../domain/conversation';
import type { ConversationRepository } from '../domain/ports';
import { toConversation, toMessage } from './prisma-conversation-rows';
import { PrismaChatReceipts } from './prisma-chat-receipts';

const PAGE_LIMIT = 200;

/** Сторінка завжди додатна й обмежена: запит не тягне всю таблицю повідомлень. */
const pageSize = (limit: number) => Math.min(Math.max(Math.trunc(limit), 1), PAGE_LIMIT);

@Injectable()
export class PrismaConversationRepository
  extends PrismaChatReceipts
  implements ConversationRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByVisit(visitId: string): Promise<Conversation | null> {
    const row = await this.prisma.chatConversation.findUnique({ where: { visitId } });
    return row ? toConversation(row) : null;
  }

  async start(input: {
    id: string;
    visitId: string;
    clientId: string;
    barberId: string;
    createdAt: Date;
  }): Promise<Conversation> {
    const row = await this.prisma.chatConversation.create({
      data: {
        id: input.id,
        visitId: input.visitId,
        clientId: input.clientId,
        barberId: input.barberId,
        createdAt: input.createdAt,
      },
    });
    return toConversation(row);
  }

  async saveMessage(message: MessageSnapshot): Promise<'saved' | 'duplicate'> {
    try {
      await this.prisma.chatMessage.create({
        data: {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          senderRole: message.senderRole,
          body: message.body,
          clientMessageId: message.clientMessageId,
          createdAt: message.createdAt,
        },
      });
      return 'saved';
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return 'duplicate';
      }
      throw error;
    }
  }

  async findMessageByClientId(
    conversationId: string,
    clientMessageId: string
  ): Promise<MessageSnapshot | null> {
    const row = await this.prisma.chatMessage.findUnique({
      where: { conversationId_clientMessageId: { conversationId, clientMessageId } },
    });
    return row ? toMessage(row) : null;
  }

  async listMessages(conversationId: string, limit: number): Promise<MessageSnapshot[]> {
    const rows = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: pageSize(limit),
    });
    return rows.reverse().map(toMessage);
  }

  async listForUser(userId: string, limit: number): Promise<Conversation[]> {
    const rows = await this.prisma.chatConversation.findMany({
      where: { OR: [{ clientId: userId }, { barberId: userId }] },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
      take: pageSize(limit),
    });
    return rows.map(toConversation);
  }

  async touchLastMessage(conversationId: string, at: Date): Promise<void> {
    await this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: at },
    });
  }
}
