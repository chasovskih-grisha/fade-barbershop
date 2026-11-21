// Домен: форма повідомлення діалогу з агентом (T-280a, ASSIST-001/ASSIST-005).
import {
  agentMessageProblem,
  assertAgentMessage,
  channelsForRole,
  InvalidAgentMessageError,
  MESSAGE_TEXT_LIMIT,
  type AgentMessage,
} from './agent-message';

const base: AgentMessage = {
  id: 'msg-1',
  conversationId: 'conv-1',
  role: 'client',
  channel: 'web',
  text: 'Хочу стрижку в суботу',
  sentAt: new Date('2026-11-19T10:00:00Z'),
};

describe('agent message (T-280a)', () => {
  it('приймає репліку клієнта з сайту', () => {
    expect(agentMessageProblem(base)).toBeNull();
  });

  it('відхиляє порожній текст і текст понад ліміт', () => {
    expect(agentMessageProblem({ ...base, text: '   ' })).toBe('text is empty');
    expect(agentMessageProblem({ ...base, text: 'a'.repeat(MESSAGE_TEXT_LIMIT + 1) })).toBe(
      'text is too long'
    );
  });

  it('тримає ліміт на межі: рівно 2000 символів приймається', () => {
    expect(agentMessageProblem({ ...base, text: 'a'.repeat(MESSAGE_TEXT_LIMIT) })).toBeNull();
  });

  it('відхиляє роль, яка не приходить із цього каналу', () => {
    expect(agentMessageProblem({ ...base, role: 'analyst', channel: 'web' })).toBe(
      'role and channel disagree'
    );
    expect(channelsForRole('analyst')).toEqual(['admin']);
  });

  it('відхиляє порожні ідентифікатори й неможливий час', () => {
    expect(agentMessageProblem({ ...base, id: '' })).toBe('id is empty');
    expect(agentMessageProblem({ ...base, conversationId: '' })).toBe('conversationId is empty');
    expect(agentMessageProblem({ ...base, sentAt: new Date('not a date') })).toBe(
      'sentAt is not a date'
    );
  });

  it('кидає помилку з назвою поля на невалідній репліці', () => {
    expect(() => assertAgentMessage({ ...base, text: '' })).toThrow(InvalidAgentMessageError);
    expect(() => assertAgentMessage({ ...base, text: '' })).toThrow('text is empty');
  });
});
