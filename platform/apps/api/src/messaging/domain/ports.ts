// Порти контексту messaging: репозиторій розмов/повідомлень, ACL до візитів
// (scheduling) і outbox для доменних подій. Жодного Nest/Prisma в домені.
import type { Conversation, MessageSnapshot } from './conversation';

export const CONVERSATION_REPOSITORY = 'ConversationRepository';
export const VISIT_PARTICIPANTS = 'VisitParticipantLookup';
export const MESSAGING_OUTBOX = 'MessagingOutbox';

export const MESSAGE_CREATED_EVENT = 'messaging.message.created';

export type VisitParties = { clientId: string; barberId: string };

/** Рядок списку розмов користувача — вхід у чат (GET /messaging/conversations). */
export type ConversationSummary = {
  conversationId: string;
  visitId: string;
  clientId: string;
  barberId: string;
  lastMessageAt: string | null;
  /** Скільки вхідних повідомлень користувач ще не прочитав (бейдж) — T-4432. */
  unreadCount: number;
};

export interface ConversationRepository {
  findByVisit(visitId: string): Promise<Conversation | null>;
  start(input: {
    id: string;
    visitId: string;
    clientId: string;
    barberId: string;
    createdAt: Date;
  }): Promise<Conversation>;
  /** `duplicate` — той самий `clientMessageId` уже збережено (реплей офлайн-черги). */
  saveMessage(message: MessageSnapshot): Promise<'saved' | 'duplicate'>;
  findMessageByClientId(
    conversationId: string,
    clientMessageId: string
  ): Promise<MessageSnapshot | null>;
  listMessages(conversationId: string, limit: number): Promise<MessageSnapshot[]>;
  /** Розмови користувача (клієнт або барбер), новіші зверху — вхід у чат. */
  listForUser(userId: string, limit: number): Promise<Conversation[]>;
  touchLastMessage(conversationId: string, at: Date): Promise<void>;
  /** Позначити вхідні повідомлення доставленими; повертає кількість змінених. */
  markDelivered(conversationId: string, readerId: string, at: Date): Promise<number>;
  /** Позначити вхідні повідомлення прочитаними; повертає кількість змінених. */
  markRead(conversationId: string, readerId: string, at: Date): Promise<number>;
  /** Непрочитані вхідні по кожній розмові — один запит на список розмов. */
  unreadCounts(
    readerId: string,
    conversationIds: readonly string[]
  ): Promise<Record<string, number>>;
  /** Усього непрочитаних по всіх розмовах користувача — бейдж у шапці застосунку. */
  unreadTotal(readerId: string): Promise<number>;
}

export interface VisitParticipantLookup {
  parties(visitId: string): Promise<VisitParties | null>;
}

export interface MessagingOutbox {
  append(
    events: readonly { type: string; aggregateId: string; payload: Record<string, unknown> }[]
  ): Promise<void>;
}
