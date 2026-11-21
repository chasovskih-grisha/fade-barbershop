// Журнал викликів інструментів агента (T-280b, ADR 0020 §5): хто, коли,
// який порт і з яким результатом. Тіла діалогу й персональних даних тут немає —
// журнал відповідає на питання «що агент робив», а не «що казав клієнт».

export type AgentToolOutcome = 'ok' | 'error';

export interface AgentLogEntry {
  id: string;
  conversationId: string;
  /** Назва порту або інструмента, який викликав агент (`slots.find`). */
  tool: string;
  outcome: AgentToolOutcome;
  at: Date;
  /** Коротка причина відмови для `error`; без персональних даних. */
  detail?: string;
}

export const AGENT_TOOL_LIMIT = 64;
export const AGENT_LOG_DETAIL_LIMIT = 200;

/** Запис журналу з формою, яку домен не приймає. */
export class InvalidAgentLogEntryError extends Error {
  constructor(readonly field: string) {
    super(`Invalid agent log entry: ${field}`);
    this.name = 'InvalidAgentLogEntryError';
  }
}

function toolProblem(tool: string): string | null {
  if (tool.trim().length === 0) return 'tool is empty';
  if (tool.length > AGENT_TOOL_LIMIT) return 'tool is too long';
  return null;
}

function detailProblem(detail: string | undefined): string | null {
  if (detail === undefined) return null;
  if (detail.trim().length === 0) return 'detail is empty';
  if (detail.length > AGENT_LOG_DETAIL_LIMIT) return 'detail is too long';
  return null;
}

/** Перша причина відмови або null, коли запис валідний. */
export function agentLogEntryProblem(entry: AgentLogEntry): string | null {
  if (entry.id.length === 0) return 'id is empty';
  if (entry.conversationId.length === 0) return 'conversationId is empty';
  if (!(entry.at instanceof Date) || Number.isNaN(entry.at.getTime())) {
    return 'at is not a date';
  }
  if (entry.outcome !== 'ok' && entry.outcome !== 'error') return 'outcome is unknown';
  return toolProblem(entry.tool) ?? detailProblem(entry.detail);
}

export function assertAgentLogEntry(entry: AgentLogEntry): void {
  const problem = agentLogEntryProblem(entry);
  if (problem !== null) throw new InvalidAgentLogEntryError(problem);
}
