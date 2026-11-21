// Порт журналу агента (T-280b): запис ідемпотентний за `id`, читання — за
// діалогом у порядку часу (патерн повторної доставки ADR 0009/0016).
import type { AgentLogEntry } from '../domain/agent-log';
import { InMemoryAgentLogRepository } from './in-memory-agent-log.repository';

const entry = (overrides: Partial<AgentLogEntry> = {}): AgentLogEntry => ({
  id: 'log-1',
  conversationId: 'conv-1',
  tool: 'slots.find',
  outcome: 'ok',
  at: new Date('2026-11-19T10:00:00Z'),
  ...overrides,
});

describe('agent log journal (T-280b)', () => {
  it('пише і читає записи діалогу в порядку часу', async () => {
    const journal = new InMemoryAgentLogRepository();
    await journal.append(entry({ id: 'log-2', at: new Date('2026-11-19T10:05:00Z') }));
    await journal.append(entry({ id: 'log-1', at: new Date('2026-11-19T10:00:00Z') }));

    const entries = await journal.listByConversation('conv-1');
    expect(entries.map((item) => item.id)).toEqual(['log-1', 'log-2']);
  });

  it('повторна доставка того самого запису не додає рядка', async () => {
    const journal = new InMemoryAgentLogRepository();
    await journal.append(entry());
    await journal.append(entry());

    expect(await journal.listByConversation('conv-1')).toHaveLength(1);
  });

  it('не змішує записи різних діалогів', async () => {
    const journal = new InMemoryAgentLogRepository();
    await journal.append(entry());
    await journal.append(entry({ id: 'log-2', conversationId: 'conv-2' }));

    expect((await journal.listByConversation('conv-2')).map((item) => item.id)).toEqual(['log-2']);
  });

  it('відмовляє запис із невалідною формою', async () => {
    const journal = new InMemoryAgentLogRepository();
    await expect(journal.append(entry({ tool: '' }))).rejects.toThrow('Invalid agent log entry');
  });
});
