// Стан діалогу з агентом (T-280a, ADR 0020 §5): агрегат AssistantConversation
// тримає стек реплік і відкритий намір. Повторна доставка того самого
// повідомлення не додає репліку — обробка ідемпотентна (ADR 0009/0016).

import { assertAgentMessage, type AgentMessage, type AgentRole } from './agent-message';

export type ConversationStatus = 'open' | 'closed';

export interface ConversationState {
  conversationId: string;
  role: AgentRole;
  status: ConversationStatus;
  messages: AgentMessage[];
  /** Номер останнього прийнятого повідомлення — межа ідемпотентності. */
  lastMessageId: string | null;
}

/** Діалог не може прийняти репліку в поточному стані. */
export class ConversationRefusedError extends Error {
  constructor(readonly reason: string) {
    super(`Conversation refused message: ${reason}`);
    this.name = 'ConversationRefusedError';
  }
}

export function openConversation(params: {
  conversationId: string;
  role: AgentRole;
}): ConversationState {
  return {
    conversationId: params.conversationId,
    role: params.role,
    status: 'open',
    messages: [],
    lastMessageId: null,
  };
}

/** Повідомлення вже в діалозі (за id) — повторна доставка, ефекту немає. */
export function isDuplicate(state: ConversationState, message: AgentMessage): boolean {
  return state.messages.some((known) => known.id === message.id);
}

/**
 * Прийняти репліку. Дубль за id повертає стан без змін; закритий діалог і
 * повідомлення з іншого діалогу — відмова, а не тихе ігнорування.
 */
export function appendMessage(state: ConversationState, message: AgentMessage): ConversationState {
  assertAgentMessage(message);
  if (message.conversationId !== state.conversationId) {
    throw new ConversationRefusedError('message belongs to another conversation');
  }
  if (state.status === 'closed') throw new ConversationRefusedError('conversation is closed');
  if (isDuplicate(state, message)) return state;
  return {
    ...state,
    messages: [...state.messages, message],
    lastMessageId: message.id,
  };
}

export function closeConversation(state: ConversationState): ConversationState {
  if (state.status === 'closed') return state;
  return { ...state, status: 'closed' };
}
