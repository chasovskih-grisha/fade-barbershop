// Домен: запис журналу агента — валідація форми без персональних даних
// (T-280b, ADR 0020 §5).
import {
  AGENT_LOG_DETAIL_LIMIT,
  AGENT_TOOL_LIMIT,
  agentLogEntryProblem,
  assertAgentLogEntry,
  InvalidAgentLogEntryError,
  type AgentLogEntry,
} from './agent-log';

const entry: AgentLogEntry = {
  id: 'log-1',
  conversationId: 'conv-1',
  tool: 'slots.find',
  outcome: 'ok',
  at: new Date('2026-11-19T10:00:00Z'),
};

describe('agent log entry (T-280b)', () => {
  it('приймає запис із результатом і без подробиці', () => {
    expect(agentLogEntryProblem(entry)).toBeNull();
    expect(agentLogEntryProblem({ ...entry, outcome: 'error', detail: 'timeout' })).toBeNull();
  });

  it('відхиляє порожній і задовгий інструмент', () => {
    expect(agentLogEntryProblem({ ...entry, tool: '  ' })).toBe('tool is empty');
    expect(agentLogEntryProblem({ ...entry, tool: 'a'.repeat(AGENT_TOOL_LIMIT + 1) })).toBe(
      'tool is too long'
    );
  });

  it('відхиляє порожню і задовгу подробицю', () => {
    expect(agentLogEntryProblem({ ...entry, detail: ' ' })).toBe('detail is empty');
    expect(agentLogEntryProblem({ ...entry, detail: 'a'.repeat(AGENT_LOG_DETAIL_LIMIT + 1) })).toBe(
      'detail is too long'
    );
  });

  it('відхиляє невідомий результат, порожній id і неможливий час', () => {
    expect(agentLogEntryProblem({ ...entry, outcome: 'maybe' as never })).toBe(
      'outcome is unknown'
    );
    expect(agentLogEntryProblem({ ...entry, id: '' })).toBe('id is empty');
    expect(agentLogEntryProblem({ ...entry, conversationId: '' })).toBe('conversationId is empty');
    expect(agentLogEntryProblem({ ...entry, at: new Date('nope') })).toBe('at is not a date');
  });

  it('кидає помилку з назвою поля на невалідному записі', () => {
    expect(() => assertAgentLogEntry({ ...entry, tool: '' })).toThrow(InvalidAgentLogEntryError);
  });
});
