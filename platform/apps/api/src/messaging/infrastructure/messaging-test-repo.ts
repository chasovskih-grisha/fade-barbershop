// Памʼять замість Prisma для спек чату (T-081): винесено зі збірки застосунку
// (LOC-гейт ADR 0019). Контракт — той самий порт ConversationRepository.
import { Conversation, type MessageSnapshot } from '../domain/conversation';
import type { ConversationRepository } from '../domain/ports';

export class MemoryConversations implements ConversationRepository {
  readonly rows = new Map<string, Conversation>();
  readonly messages: MessageSnapshot[] = [];

  async findByVisit(visitId: string): Promise<Conversation | null> {
    return [...this.rows.values()].find((row) => row.visitId === visitId) ?? null;
  }

  async start(input: {
    id: string;
    visitId: string;
    clientId: string;
    barberId: string;
    createdAt: Date;
  }): Promise<Conversation> {
    const conversation = Conversation.open({ ...input, lastMessageAt: null });
    this.rows.set(input.id, conversation);
    return conversation;
  }

  async saveMessage(message: MessageSnapshot): Promise<'saved' | 'duplicate'> {
    const replay = this.messages.some(
      (row) =>
        message.clientMessageId &&
        row.conversationId === message.conversationId &&
        row.clientMessageId === message.clientMessageId
    );
    if (replay) return 'duplicate';
    this.messages.push(message);
    return 'saved';
  }

  async findMessageByClientId(
    conversationId: string,
    clientMessageId: string
  ): Promise<MessageSnapshot | null> {
    return (
      this.messages.find(
        (row) => row.conversationId === conversationId && row.clientMessageId === clientMessageId
      ) ?? null
    );
  }

  async listMessages(conversationId: string, limit: number): Promise<MessageSnapshot[]> {
    return this.messages.filter((row) => row.conversationId === conversationId).slice(-limit);
  }

  async listForUser(userId: string): Promise<Conversation[]> {
    return [...this.rows.values()].filter(
      (row) => row.clientId === userId || row.barberId === userId
    );
  }

  async markDelivered(conversationId: string, readerId: string, at: Date): Promise<number> {
    const incoming = this.incomingOf(conversationId, readerId).filter((row) => !row.deliveredAt);
    for (const row of incoming) row.deliveredAt = at;
    return incoming.length;
  }

  async markRead(conversationId: string, readerId: string, at: Date): Promise<number> {
    await this.markDelivered(conversationId, readerId, at);
    const unread = this.incomingOf(conversationId, readerId).filter((row) => !row.readAt);
    for (const row of unread) row.readAt = at;
    return unread.length;
  }

  async unreadCounts(
    readerId: string,
    conversationIds: readonly string[]
  ): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const id of conversationIds) {
      counts[id] = this.incomingOf(id, readerId).filter((row) => !row.readAt).length;
    }
    return counts;
  }

  async unreadTotal(readerId: string): Promise<number> {
    const mine = [...this.rows.values()].filter(
      (row) => row.clientId === readerId || row.barberId === readerId
    );
    const counts = await this.unreadCounts(
      readerId,
      mine.map((row) => row.id)
    );
    return Object.values(counts).reduce((sum, count) => sum + count, 0);
  }

  private incomingOf(conversationId: string, readerId: string): MessageSnapshot[] {
    return this.messages.filter(
      (row) => row.conversationId === conversationId && row.senderId !== readerId
    );
  }

  async touchLastMessage(): Promise<void> {}
}
