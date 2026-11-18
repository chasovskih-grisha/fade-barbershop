'use client';

import React, { useState } from 'react';
import { Badge, Button } from '@fade/ui';

export function HomeFAQ() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'booking' | 'perks' | 'support'>('all');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [faqFeedback, setFaqFeedback] = useState<Record<number, 'yes' | 'no'>>({});
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: 'Вітаю! Я віртуальний консьєрж підтримки FADE. Чим можу допомогти вам сьогодні? (Запис, оплата, статус бонусів тощо)',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const faqs = [
    {
      category: 'booking',
      q: 'Як записатися на стрижку?',
      a: 'Запис займає до 60 секунд. Оберіть послугу, майстра, зручний час та підтвердіть телефон через SMS (OTP). Без створення складних паролів.',
    },
    {
      category: 'perks',
      q: 'Чи є знижка для нового гостя?',
      a: 'Так, на перший візит діє спеціальна знижка -100 ₴ на будь-яку стрижку в мережі FADE.',
    },
    {
      category: 'support',
      q: 'Що таке формат «2 крісла»?',
      a: 'Це концепція приватного простору без черг, натовпу та галасу. Тільки ви, ваш майстер, гарячий рушник та якісна музика.',
    },
    {
      category: 'booking',
      q: 'Як перенести або скасувати візит?',
      a: 'Увійдіть до особистого кабінету за номером телефону. Ви зможете змінити час або скасувати запис в один клік без дзвінків адміністратору.',
    },
    {
      category: 'support',
      q: 'Які гарантії якості надає FADE?',
      a: 'Ми гарантуємо 100% задоволеність. Якщо результат потребує коригування протягом 48 годин після візиту, ми виконаємо його безкоштовно.',
    },
    {
      category: 'perks',
      q: 'Як працює кешбек та бонусна програма?',
      a: 'З кожної оплати послуг на ваш баланс нараховується до 5% кешбеку, який можна списувати на наступні візити або подарункові сертифікати.',
    },
  ];

  const filteredFaqs = faqs
    .map((item, originalIdx) => ({ ...item, originalIdx }))
    .filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userText = chatMessage;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText, time: now }]);
    setChatMessage('');

    setTimeout(() => {
      let botReply = 'Дякуємо за запитання! Наш консьєрж опрацював запит. Для термінової допомоги ви також можете зателефонувати +38 (044) 334-33-33 або написати в Telegram @fade_support_bot.';
      const lower = userText.toLowerCase();
      if (lower.includes('запис') || lower.includes('час') || lower.includes('записатися')) {
        botReply = 'Записатися можна через кнопку «Записатися» у верхньому меню всього за 60 секунд. Потрібен лише ваш номер телефону!';
      } else if (lower.includes('знижк') || lower.includes('акці') || lower.includes('бонус')) {
        botReply = 'Для нових гостей діє знижка -100 ₴ на перший візит, а також кешбек 5% на всі наступні відвідування.';
      } else if (lower.includes('адрес') || lower.includes('де') || lower.includes('карта')) {
        botReply = 'Наші студії розташовані у зручних центральних локаціях Києва. Точну адресу можна обрати на етапі вибору локації під час запису.';
      }

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: botReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 600);
  };

  return (
    <section className="flex flex-col gap-8 py-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex flex-col gap-2 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/10 border border-accent-blue/20 px-3 py-1 text-caption font-semibold uppercase text-accent-blue">
            ✦ Підтримка та Клієнтський досвід
          </div>
          <h2 className="font-display text-h3 font-bold text-fg">Часті запитання та Підтримка</h2>
          <p className="text-body text-fg-secondary">
            Все, що варто знати перед першим візитом до FADE. Ми на зв&apos;язку щодня з 9:00 до 21:00.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="inline-flex items-center gap-2 rounded-input bg-accent text-accent-fg border border-accent px-4 py-2.5 text-body font-semibold hover:opacity-90 transition-all shadow-sm"
          >
            💬 {chatOpen ? 'Закрити чат' : 'Живий консьєрж'}
          </button>
          <a
            href="https://t.me/fade_support_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-input bg-interactive border border-line px-4 py-2.5 text-body font-semibold text-fg hover:bg-accent hover:text-accent-fg hover:border-accent transition-all shadow-sm"
          >
            ✈️ Telegram
          </a>
        </div>
      </div>

      {/* Interactive Support Chat Drawer / Modal Box */}
      {chatOpen && (
        <div className="rounded-[var(--radius-card)] bg-surface-raised border border-accent-blue/30 p-5 shadow-lg flex flex-col gap-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-semantic-success animate-pulse" />
              <h3 className="font-display text-h4 font-medium text-fg">Онлайн-підтримка FADE (24/7 консьєрж)</h3>
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

      {/* Search and Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Пошук по запитаннях (наприклад: знижка, скасування, кешбек)..."
          aria-label="Пошук по запитаннях"
          className="flex-1 rounded-input border border-line bg-surface-raised px-4 py-2.5 text-sm text-fg focus:outline-none focus:border-accent shadow-sm"
        />
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Усі' },
            { id: 'booking', label: 'Запис та візити' },
            { id: 'perks', label: 'Знижки та бонуси' },
            { id: 'support', label: 'Сервіс та простір' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-input border transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-accent text-accent-fg border-accent shadow-sm'
                  : 'bg-surface-raised text-fg-secondary border-line hover:text-fg'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Grid */}
      {filteredFaqs.length === 0 ? (
        <div className="text-center py-12 bg-surface-raised border border-line rounded-[var(--radius-card)] flex flex-col items-center gap-3">
          <p className="text-fg-secondary">За вашим запитом нічого не знайдено.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="text-xs font-semibold text-accent underline"
          >
            Скинути фільтри
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFaqs.map((item) => (
            <div
              key={item.originalIdx}
              className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-surface-raised border border-line p-6 shadow-sm hover:border-accent-blue/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-h4 font-medium text-fg">{item.q}</h3>
                <Badge tone="neutral">
                  {item.category === 'booking' ? 'Запис' : item.category === 'perks' ? 'Бонуси' : 'Сервіс'}
                </Badge>
              </div>
              <p className="text-body text-fg-secondary">{item.a}</p>
              <div className="mt-3 pt-3 border-t border-line/50 flex items-center justify-between text-xs text-fg-secondary">
                <span>Чи допомогла ця відповідь?</span>
                {faqFeedback[item.originalIdx] ? (
                  <span className="text-accent font-medium">Дякуємо за відгук! ✦</span>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFaqFeedback((prev) => ({ ...prev, [item.originalIdx]: 'yes' }))}
                      className="px-2.5 py-1 rounded-input bg-surface-base border border-line hover:border-accent text-fg transition-all"
                    >
                      👍 Так
                    </button>
                    <button
                      onClick={() => setFaqFeedback((prev) => ({ ...prev, [item.originalIdx]: 'no' }))}
                      className="px-2.5 py-1 rounded-input bg-surface-base border border-line hover:border-accent text-fg transition-all"
                    >
                      👎 Ні
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
