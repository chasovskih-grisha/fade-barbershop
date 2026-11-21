// Домен: агрегат AssistantConversation як єдина точка входу реплік
// (T-280b, ADR 0020 §5).
import type { AgentMessage } from './agent-message';
import { AssistantConversation } from './assistant-conversation';
import { ConversationRefusedError } from './conversation-state';

const message = (overrides: Partial<AgentMessage> = {}): AgentMessage => ({
  id: 'msg-1',
  conversationId: 'conv-1',
  role: 'client',
  channel: 'web',
  text: 'Хочу стрижку в суботу',
  sentAt: new Date('2026-11-19T10:00:00Z'),
  ...overrides,
});

const opened = () => AssistantConversation.open({ conversationId: 'conv-1', role: 'client' });

describe('assistant conversation aggregate (T-280b)', () => {
  it('відкривається порожнім у статусі open', () => {
    const conversation = opened();
    expect(conversation.status).toBe('open');
    expect(conversation.messages).toEqual([]);
    expect(conversation.lastMessageId).toBeNull();
  });

  it('приймає репліку і рухає межу ідемпотентності', () => {
    const conversation = opened();
    conversation.accept(message());
    expect(conversation.messages).toHaveLength(1);
    expect(conversation.lastMessageId).toBe('msg-1');
  });

  it('повторна доставка репліки не додає її вдруге', () => {
    const conversation = opened();
    conversation.accept(message());
    conversation.accept(message());
    expect(conversation.messages).toHaveLength(1);
  });

  it('закритий діалог не приймає реплік', () => {
    const conversation = opened();
    conversation.close();
    expect(conversation.status).toBe('closed');
    expect(() => conversation.accept(message())).toThrow(ConversationRefusedError);
  });

  it('не приймає репліку з іншого діалогу', () => {
    const conversation = opened();
    expect(() => conversation.accept(message({ conversationId: 'conv-2' }))).toThrow(
      ConversationRefusedError
    );
  });

  it('не приймає репліку з каналу чужої ролі', () => {
    const conversation = opened();
    expect(() => conversation.accept(message({ channel: 'admin' }))).toThrow(
      'Invalid agent message'
    );
  });
});
