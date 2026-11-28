// Запити позначок доставки/прочитання (T-4432). Винесено з репозиторію за
// LOC-гейтом: сама розмова й повідомлення лишаються в
// prisma-conversation.repository.ts, тут — лише масові оновлення й підрахунок
// непрочитаних одним запитом на список розмов.
import type { PrismaService } from '../../shared/prisma/prisma.service';

export class PrismaChatReceipts {
  constructor(protected readonly prisma: PrismaService) {}

  async markDelivered(conversationId: string, readerId: string, at: Date): Promise<number> {
    const result = await this.prisma.chatMessage.updateMany({
      where: { conversationId, senderId: { not: readerId }, deliveredAt: null },
      data: { deliveredAt: at },
    });
    return result.count;
  }

  /** Прочитане завжди доставлене: спершу закриваємо доставку, потім readAt. */
  async markRead(conversationId: string, readerId: string, at: Date): Promise<number> {
    await this.markDelivered(conversationId, readerId, at);
    const result = await this.prisma.chatMessage.updateMany({
      where: { conversationId, senderId: { not: readerId }, readAt: null },
      data: { readAt: at },
    });
    return result.count;
  }

  async unreadCounts(
    readerId: string,
    conversationIds: readonly string[]
  ): Promise<Record<string, number>> {
    if (conversationIds.length === 0) return {};
    const rows = await this.prisma.chatMessage.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: { in: [...conversationIds] },
        senderId: { not: readerId },
        readAt: null,
      },
      _count: { _all: true },
    });
    return Object.fromEntries(rows.map((row) => [row.conversationId, row._count._all]));
  }

  /** Бейдж шапки: один count через розмови користувача, без читання рядків. */
  async unreadTotal(readerId: string): Promise<number> {
    return this.prisma.chatMessage.count({
      where: {
        readAt: null,
        senderId: { not: readerId },
        conversation: { is: { OR: [{ clientId: readerId }, { barberId: readerId }] } },
      },
    });
  }
}
