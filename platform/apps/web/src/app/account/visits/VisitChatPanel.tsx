'use client';

// Панель чату на картці візиту (T-081b). Згорнута за замовчуванням: історія
// тягнеться лише після відкриття. 403/404 — «чат недоступний», а не зламана
// сторінка (чужий візит сервер не віддає).

import { useEffect, useState } from 'react';
import { Button, ChatBubble } from '@fade/ui';
import {
  fetchVisitChat,
  newClientMessageId,
  sendVisitChatMessage,
  VisitChatUnavailable,
} from './visitChatApi';
import type { VisitChatMessage } from './visitChatApi';

type PanelState = 'closed' | 'loading' | 'ready' | 'unavailable' | 'error';

export const CHAT_UNAVAILABLE_TEXT = 'Чат недоступний для цього візиту.';
const CHAT_ERROR_TEXT = 'Не вдалося завантажити чат. Спробуйте пізніше.';

function timeOf(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function VisitChatPanel({ visitId }: { visitId: string }) {
  const [state, setState] = useState<PanelState>('closed');
  const [messages, setMessages] = useState<VisitChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (state !== 'loading') return;
    let alive = true;
    fetchVisitChat(visitId)
      .then((history) => {
        if (!alive) return;
        setMessages(history);
        setState('ready');
      })
      .catch((error: unknown) => {
        if (!alive) return;
        setState(error instanceof VisitChatUnavailable ? 'unavailable' : 'error');
      });
    return () => {
      alive = false;
    };
  }, [state, visitId]);

  const open = () => setState((current) => (current === 'closed' ? 'loading' : current));

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const result = await sendVisitChatMessage(visitId, body, newClientMessageId());
      setMessages((prev) => [...prev, result.message]);
      setDraft('');
    } catch (error: unknown) {
      setState(error instanceof VisitChatUnavailable ? 'unavailable' : 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border-t border-border/60 pt-3 flex flex-col gap-3" data-testid="visit-chat">
      <Button variant="ghost" onClick={open} disabled={state !== 'closed'}>
        Чат із майстром
      </Button>
      {state === 'loading' && <p className="text-body-s text-fg-secondary">Завантажуємо чат…</p>}
      {state === 'unavailable' && <p className="text-body-s text-fg-secondary">{CHAT_UNAVAILABLE_TEXT}</p>}
      {state === 'error' && (
        <p className="text-body-s text-fg-secondary">{CHAT_ERROR_TEXT}</p>
      )}
      {state === 'ready' && (
        <div className="flex flex-col gap-2" data-testid="visit-chat-history">
          {messages.length === 0 ? (
            <p className="text-body-s text-fg-secondary">Повідомлень ще немає.</p>
          ) : (
            messages.map((message) => (
              <ChatBubble
                key={message.id}
                author={message.senderRole === 'client' ? 'client' : 'staff'}
                text={message.body}
                time={timeOf(message.createdAt)}
              />
            ))
          )}
        </div>
      )}
      {(state === 'ready' || state === 'error') && (
        <div className="flex items-end gap-2">
          <input
            aria-label="Повідомлення майстру"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="h-11 flex-1 rounded-input border border-line bg-surface px-3 text-body text-fg"
          />
          <Button onClick={send} disabled={sending || draft.trim() === ''}>
            Надіслати
          </Button>
        </div>
      )}
    </div>
  );
}
