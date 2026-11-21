// Домен: метадані ходу агента і нормалізація наміру-кандидата (T-280a).
import {
  agentTurnProblem,
  assertAgentTurn,
  INTENT_LIMIT,
  InvalidAgentTurnError,
  normalizeIntent,
  type AgentTurn,
} from './agent-turn';

const turn: AgentTurn = {
  conversationId: 'conv-1',
  channel: 'web',
  intent: 'book_slot',
  at: new Date('2026-11-19T10:00:00Z'),
};

describe('agent turn (T-280a)', () => {
  it('приймає хід із наміром і без нього', () => {
    expect(agentTurnProblem(turn)).toBeNull();
    expect(agentTurnProblem({ ...turn, intent: null })).toBeNull();
  });

  it('відхиляє порожній і задовгий намір', () => {
    expect(agentTurnProblem({ ...turn, intent: '  ' })).toBe('intent is empty');
    expect(agentTurnProblem({ ...turn, intent: 'a'.repeat(INTENT_LIMIT + 1) })).toBe(
      'intent is too long'
    );
  });

  it('відхиляє порожній діалог і неможливий час', () => {
    expect(agentTurnProblem({ ...turn, conversationId: '' })).toBe('conversationId is empty');
    expect(agentTurnProblem({ ...turn, at: new Date('nope') })).toBe('at is not a date');
  });

  it('кидає помилку з назвою поля на невалідному ході', () => {
    expect(() => assertAgentTurn({ ...turn, intent: '' })).toThrow(InvalidAgentTurnError);
  });

  it('нормалізує намір у порівнювану форму', () => {
    expect(normalizeIntent('  Book Slot ')).toBe('book_slot');
    expect(normalizeIntent('reschedule-visit')).toBe('reschedule_visit');
    expect(normalizeIntent('  ')).toBe('');
  });
});
