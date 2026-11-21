// Домен `assistants` (T-280a, ADR 0020): повідомлення діалогу з агентом.
// Роль — позиція в розмові (клієнт / консьєрж / аналітик / опс), не працівник;
// канал — джерело вводу. Кожна роль приходить лише зі свого каналу.

export type AgentRole = 'client' | 'concierge' | 'analyst' | 'ops';
export type AgentChannel = 'web' | 'mobile' | 'admin';

export interface AgentMessage {
  id: string;
  conversationId: string;
  role: AgentRole;
  channel: AgentChannel;
  text: string;
  sentAt: Date;
}

/** Довжина тексту одного повідомлення: діалог — репліка, не документ. */
export const MESSAGE_TEXT_LIMIT = 2000;

const ROLE_CHANNELS: Record<AgentRole, readonly AgentChannel[]> = {
  client: ['web', 'mobile'],
  concierge: ['web', 'mobile'],
  analyst: ['admin'],
  ops: ['admin'],
};

/** Повідомлення не має форми, яку домен може прийняти в діалог. */
export class InvalidAgentMessageError extends Error {
  constructor(readonly field: string) {
    super(`Invalid agent message: ${field}`);
    this.name = 'InvalidAgentMessageError';
  }
}

export function channelsForRole(role: AgentRole): readonly AgentChannel[] {
  return ROLE_CHANNELS[role] ?? [];
}

function textProblem(text: string): string | null {
  if (text.trim().length === 0) return 'text is empty';
  if (text.length > MESSAGE_TEXT_LIMIT) return 'text is too long';
  return null;
}

/** Перша причина відмови або null, коли повідомлення валідне. */
export function agentMessageProblem(message: AgentMessage): string | null {
  if (message.id.length === 0) return 'id is empty';
  if (message.conversationId.length === 0) return 'conversationId is empty';
  if (!(message.sentAt instanceof Date) || Number.isNaN(message.sentAt.getTime())) {
    return 'sentAt is not a date';
  }
  if (!channelsForRole(message.role).includes(message.channel)) return 'role and channel disagree';
  return textProblem(message.text);
}

export function assertAgentMessage(message: AgentMessage): void {
  const problem = agentMessageProblem(message);
  if (problem !== null) throw new InvalidAgentMessageError(problem);
}
