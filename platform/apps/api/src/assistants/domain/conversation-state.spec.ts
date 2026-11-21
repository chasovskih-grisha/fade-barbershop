// Домен: агрегат AssistantConversation і ідемпотентна обробка реплік
// (T-280a, ADR 0020 §5; патерн повторної доставки ADR 0009/0016).
import type { AgentMessage } from './agent-message';
import {
  appendMessage,
  closeConversation,
  ConversationRefusedError,
  isDuplicate,
  openConversation,
} from './conversation-state';

const message = (overrides: Partial<AgentMessage> = {}): AgentMessage => ({
  id: 'msg-1',
  conversationId: 'conv-1',
  role: 'client',
  channel: 'web',
  text: 'Хочу стрижку в суботу',
  sentAt: new Date('2026-11-19T10:00:00Z'),
  ...overrides,
});

const opened = () => openConversation({ conversationId: 'conv-1', role: 'client' });

describe('assistant conversation (T-280a)', () => {
  it('відкриває порожній діалог у статусі open', () => {
    expect(opened()).toEqual({
      conversationId: 'conv-1',
      role: 'client',
      status: 'open',
      messages: [],
      lastMessageId: null,
    });
  });

  it('додає репліку і зсуває межу останнього повідомлення', () => {
    const state = appendMessage(opened(), message());

    expect(state.messages).toHaveLength(1);
    expect(state.lastMessageId).toBe('msg-1');
  });

  it('повторна доставка того самого повідомлення не додає репліку', () => {
    const once = appendMessage(opened(), message());
    const twice = appendMessage(once, message());

    expect(twice).toBe(once);
    expect(twice.messages).toHaveLength(1);
  });

  it('розрізняє дубль за id і нову репліку', () => {
    const state = appendMessage(opened(), message());

    expect(isDuplicate(state, message())).toBe(true);
    expect(isDuplicate(state, message({ id: 'msg-2' }))).toBe(false);
  });

  it('відмовляє репліці з іншого діалогу', () => {
    const foreign = message({ conversationId: 'conv-2' });

    expect(() => appendMessage(opened(), foreign)).toThrow(ConversationRefusedError);
  });

  it('не приймає репліку в закритий діалог', () => {
    const closed = closeConversation(opened());

    expect(closed.status).toBe('closed');
    expect(() => appendMessage(closed, message())).toThrow('conversation is closed');
  });

  it('закриття повторно нічого не змінює', () => {
    const closed = closeConversation(opened());

    expect(closeConversation(closed)).toBe(closed);
  });

  it('відмовляє невалідній репліці до будь-якої зміни стану', () => {
    expect(() => appendMessage(opened(), message({ text: '' }))).toThrow('text is empty');
  });
});
