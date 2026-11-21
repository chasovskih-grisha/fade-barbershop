'use client';

import React, { useState } from 'react';
import { Badge, Button } from '@fade/ui';
import { getBotReply } from './home-chat-helper';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function HomeFaqChat() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: 'Вітаю! Я віртуальний консьєрж підтримки FADE. Чим можу допомогти вам сьогодні? (Запис, оплата, статус бонусів тощо)',
      time: now(),
    },
  ]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    setChatMessages((prev) => [...prev, { sender: 'user', text: chatMessage, time: now() }]);
    setChatMessage('');

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'bot', text: getBotReply(chatMessage), time: now() },
      ]);
    }, 600);
  };

  return (
    <>
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="inline-flex items-center gap-2 rounded-input bg-accent text-accent-fg border border-accent px-4 py-2.5 text-body font-semibold hover:opacity-90 transition-all shadow-sm"
      >
        💬 {chatOpen ? 'Закрити чат' : 'Живий консьєрж'}
      </button>
      {chatOpen && (
        <div className="rounded-[var(--radius-card)] bg-surface-raised border border-accent-blue/30 p-5 shadow-lg flex flex-col gap-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-semantic-success animate-pulse" />
              <h3 className="font-display text-h4 font-medium text-fg">
                Онлайн-підтримка FADE (24/7 консьєрж)
              </h3>
            </div>
            <Badge tone="success">Онлайн</Badge>
          </div>
          <div className="flex flex-col gap-3 max-h-72 overflow-y-auto p-2">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col max-w-[80%] ${
                  msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div
                  className={`p-3 rounded-card text-sm ${
                    msg.sender === 'user'
                      ? 'bg-accent text-accent-fg rounded-br-none'
                      : 'bg-surface-sunken border border-line text-fg rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-fg-secondary mt-1 px-1">{msg.time}</span>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-line">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Напишіть ваше запитання (наприклад: як записатися, акції)..."
              aria-label="Повідомлення для підтримки"
              className="flex-1 rounded-input border border-line bg-surface-base px-3.5 py-2.5 text-sm text-fg focus:outline-none focus:border-accent"
            />
            <Button type="submit" variant="primary">
              Надіслати
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
