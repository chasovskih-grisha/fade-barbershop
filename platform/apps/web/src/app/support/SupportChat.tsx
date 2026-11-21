'use client';

import { useState } from 'react';
import { Card, Button, TextField, Badge } from '@fade/ui';
import { getBotResponse } from './support-chat-helper';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

const QUICK_PROMPTS = ['Як скасувати запис?', 'Де мій кешбек?', 'Яка вартість послуг?'];

const INITIAL_MESSAGES: ChatMessage[] = [
  { sender: 'bot', text: 'Вітаю! Я віртуальний консьєрж FADE. Чим можу допомогти вам сьогодні?' },
];

export function SupportChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');

  const sendMessage = (preset?: string) => {
    const query = preset || input;
    if (!query.trim()) return;

    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    if (!preset) setInput('');

    setTimeout(() => {
      setMessages((prev) => [...prev, { sender: 'bot', text: getBotResponse(query) }]);
    }, 300);
  };

  return (
    <Card className="p-6 md:p-8 bg-surface-base border border-line space-y-4">
      <div className="space-y-1">
        <Badge tone="success" className="mb-1">
          ШІ-Консьєрж 24/7
        </Badge>
        <h3 className="font-display text-xl font-bold text-text-primary">
          Миттєвий чат підтримки FADE
        </h3>
        <p className="text-xs text-text-muted">
          Поставте запитання нашому віртуальному асистенту або оберіть швидку тему нижче:
        </p>
      </div>

      <div className="max-h-60 overflow-y-auto space-y-3 p-4 rounded-lg bg-surface-sunken border border-line">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 text-xs leading-relaxed ${
                message.sender === 'user'
                  ? 'bg-accent text-accent-fg'
                  : 'bg-surface-base border border-line text-text-primary'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="text-text-muted self-center font-medium">Швидкі теми:</span>
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => sendMessage(prompt)}
            className="px-2.5 py-1 rounded-full bg-surface-sunken border border-line hover:border-action-primary text-text-primary transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage();
        }}
        className="flex gap-2 pt-2"
      >
        <TextField
          id="ai-chat-input"
          label=""
          placeholder="Введіть ваше запитання..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="flex-1 bg-surface-base"
        />
        <Button type="submit" variant="primary" className="self-end text-xs px-4 py-2.5">
          Надіслати
        </Button>
      </form>
    </Card>
  );
}
