// Надіслати повідомлення у чат візиту (T-081). Розмова створюється ліниво при
// першому повідомленні; право писати має лише клієнт візиту і його барбер.
// Повтор із тим самим `clientMessageId` (довантаження офлайн-черги) не плодить
// другий рядок і не шле другий push — повертає збережене повідомлення.
import { Inject, Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import { Conversation, VisitNotFound, type MessageSnapshot } from '../domain/conversation';
import { ChatAnnouncer } from './chat-announcer';
import {
  CONVERSATION_REPOSITORY,
  VISIT_PARTICIPANTS,
  type ConversationRepository,
  type VisitParticipantLookup,
} from '../domain/ports';

export const CHAT_HISTORY_LIMIT = 200;

export type SendChatMessageInput = {
  visitId: string;
  senderId: string;
  body: string;
  clientMessageId?: string | null;
};

export type SendChatMessageResult = {
  conversationId: string;
  message: MessageSnapshot;
  duplicate: boolean;
};

@Injectable()
export class SendChatMessage {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: ConversationRepository,
    @Inject(VISIT_PARTICIPANTS) private readonly visits: VisitParticipantLookup,
    private readonly announcer: ChatAnnouncer
  ) {}

  async execute(input: SendChatMessageInput): Promise<SendChatMessageResult> {
    const conversation = await this.ensureConversation(input.visitId);
    conversation.assertParticipant(input.senderId);

    const clientMessageId = input.clientMessageId?.trim() || null;
    if (clientMessageId) {
      const previous = await this.conversations.findMessageByClientId(
        conversation.id,
        clientMessageId
      );
      if (previous) return { conversationId: conversation.id, message: previous, duplicate: true };
    }

    const message = conversation.compose({
      id: uuidv7(),
      senderId: input.senderId,
      body: input.body,
      clientMessageId,
      createdAt: new Date(),
    });
    const outcome = await this.conversations.saveMessage(message);
    if (outcome === 'duplicate' && clientMessageId) {
      const raced = await this.conversations.findMessageByClientId(
        conversation.id,
        clientMessageId
      );
      if (raced) return { conversationId: conversation.id, message: raced, duplicate: true };
    }

    await this.conversations.touchLastMessage(conversation.id, message.createdAt);
    await this.announcer.announce(
      conversation.id,
      message,
      conversation.recipientFor(input.senderId)
    );
    return { conversationId: conversation.id, message, duplicate: false };
  }

  /** Читання й запис ділять одну гарантію: розмова існує лише для справжнього візиту. */
  async ensureConversation(visitId: string): Promise<Conversation> {
    const existing = await this.conversations.findByVisit(visitId);
    if (existing) return existing;
    const parties = await this.visits.parties(visitId);
    if (!parties) throw new VisitNotFound();
    return this.conversations.start({
      id: uuidv7(),
      visitId,
      clientId: parties.clientId,
      barberId: parties.barberId,
      createdAt: new Date(),
    });
  }
}
