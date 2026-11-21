import { assertAgentLogEntry, type AgentLogEntry } from '../domain/agent-log';
import type { AgentLogRepository } from './agent-log.repository';

/** In-memory реалізація порту для dev і тестів (T-280b). */
export class InMemoryAgentLogRepository implements AgentLogRepository {
  private readonly entries: AgentLogEntry[] = [];

  async append(entry: AgentLogEntry): Promise<void> {
    assertAgentLogEntry(entry);
    if (this.entries.some((known) => known.id === entry.id)) return;
    this.entries.push(entry);
  }

  async listByConversation(conversationId: string): Promise<AgentLogEntry[]> {
    return this.entries
      .filter((entry) => entry.conversationId === conversationId)
      .sort((left, right) => left.at.getTime() - right.at.getTime());
  }
}
