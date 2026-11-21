import type { AgentLogEntry } from '../domain/agent-log';

/** Порт журналу агента (T-280b): запис і читання в порядку часу. */
export interface AgentLogRepository {
  /** Повторна доставка того самого `id` не додає запису (ADR 0009/0016). */
  append(entry: AgentLogEntry): Promise<void>;
  listByConversation(conversationId: string): Promise<AgentLogEntry[]>;
}

export const AGENT_LOG = 'AGENT_LOG';
