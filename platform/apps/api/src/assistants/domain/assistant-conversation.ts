// Агрегат AssistantConversation (T-280b, ADR 0020 §5): тримає стан діалогу й
// єдина точка, через яку репліки входять у нього. Правила — в чистих функціях
// `conversation-state`; клас лише не дає обійти їх ззовні.

import type { AgentMessage, AgentRole } from './agent-message';
import {
  appendMessage,
  closeConversation,
  openConversation,
  type ConversationState,
  type ConversationStatus,
} from './conversation-state';

export class AssistantConversation {
  private constructor(private state: ConversationState) {}

  static open(params: { conversationId: string; role: AgentRole }): AssistantConversation {
    return new AssistantConversation(openConversation(params));
  }

  get conversationId(): string {
    return this.state.conversationId;
  }

  get role(): AgentRole {
    return this.state.role;
  }

  get status(): ConversationStatus {
    return this.state.status;
  }

  get messages(): readonly AgentMessage[] {
    return this.state.messages;
  }

  get lastMessageId(): string | null {
    return this.state.lastMessageId;
  }

  /** Приймає репліку; дубль за id не змінює стан, закритий діалог — відмова. */
  accept(message: AgentMessage): void {
    this.state = appendMessage(this.state, message);
  }

  close(): void {
    this.state = closeConversation(this.state);
  }

  snapshot(): ConversationState {
    return this.state;
  }
}
