'use client';

import React, { useState, useMemo } from 'react';
import { Card, Button, TextField, Badge, AlertBanner, EmptyState } from '@fade/ui';

interface FaqItem {
  id: string;
  category: 'booking' | 'service' | 'loyalty' | 'payment';
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: '1',
    category: 'booking',
    question: 'Як скасувати або перенести запис?',
    answer: 'Ви можете самостійно керувати своїми записами в розділі «Особистий кабінет -> Мої візити» не пізніше ніж за 3 години до початку візиту. Також доступна швидка допомога через Telegram-консьєрж.',
  },
  {
    id: '2',
    category: 'booking',
    question: 'Що робити, якщо я запізнююся на стрижку?',
    answer: 'Будь ласка, повідомте адміністратора за телефоном обраного барбершопу або через Telegram. Якщо запізнення перевищує 15 хвилин, майстер може бути змушений скоротити перелік послуг або перенести візит.',
  },
  {
    id: '3',
    category: 'service',
    question: 'Які послуги входять до комплексу «Стрижка + Борода»?',
    answer: 'Комплекс включає консультацію стиліста, моделювання зачіски, миття голови професійною косметикою, стрижку бороди тримером та бритвами з гарячим рушником і стайлінг.',
  },
  {
    id: '4',
    category: 'loyalty',
    question: 'Як працює кешбек та програма лояльності FADE CLUB?',
    answer: 'Кожен гість автоматично отримує кешбек від 5% до 10% у вигляді бонусів на рахунок із кожної оплаченої послуги чи покупки косметики. Бонусами можна сплатити до 50% наступного візиту.',
  },
  {
    id: '5',
    category: 'payment',
    question: 'Чи можна розрахуватися карткою або криптовалютою?',
    answer: 'Ми приймаємо всі основні платіжні картки (Visa, Mastercard, Apple Pay, Google Pay), а також безготівковий розрахунок для корпоративних клієнтів і криптовалютні платежі.',
  },
];

export default function SupportCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ticketForm, setTicketForm] = useState({ name: '', phone: '', message: '' });
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [faqVotes, setFaqVotes] = useState<Record<string, 'yes' | 'no'>>({});
  const [diagnosticScenario, setDiagnosticScenario] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'bot', text: 'Вітаю! Я віртуальний консьєрж FADE. Чим можу допомогти вам сьогодні?' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [callbackPhone, setCallbackPhone] = useState('');
  const [callbackRequested, setCallbackRequested] = useState(false);

  // CSAT Support Rating State
  const [csatRating, setCsatRating] = useState<number | null>(null);
  const [csatSubmitted, setCsatSubmitted] = useState(false);
  const [csatFeedbackText, setCsatFeedbackText] = useState('');

  // Ticket Tracker State
  const [trackingCode, setTrackingCode] = useState('');
  const [ticketStatusResult, setTicketStatusResult] = useState<{
    id: string;
    status: 'review' | 'resolved' | 'assigned';
    statusText: string;
    updatedAt: string;
    assignee: string;
  } | null>(null);
  const [trackingError, setTrackingError] = useState(false);

  const handleTrackTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;
    const clean = trackingCode.trim().toUpperCase();
    if (clean.includes('TICK') || clean.startsWith('+380') || clean.length >= 6) {
      setTicketStatusResult({
        id: clean.startsWith('TICK') ? clean : `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'review',
        statusText: 'В обробці консьєржем',
        updatedAt: 'Щойно',
        assignee: 'Старший адміністратор FADE Hub',
      });
      setTrackingError(false);
    } else {
      setTicketStatusResult(null);
      setTrackingError(true);
    }
  };

  const handleSendChatMessage = (textToSend?: string) => {
    const query = textToSend || chatInput;
    if (!query.trim()) return;

    const newMessages = [...chatMessages, { sender: 'user' as const, text: query }];
    setChatMessages(newMessages);
    if (!textToSend) setChatInput('');

    setTimeout(() => {
      let botResponse = 'Дякую за запитання! Наші спеціалісти також доступні через Telegram-консьєрж @fade_support_bot або за телефоном +380443334455.';
      const lower = query.toLowerCase();
      if (lower.includes('скасув') || lower.includes('перенес')) {
        botResponse = 'Ви можете безкоштовно скасувати або перенести запис у «Особистий кабінет -> Мої візити» не пізніше ніж за 3 години до візиту.';
      } else if (lower.includes('кешбек') || lower.includes('бонус') || lower.includes('знижк')) {
        botResponse = 'Ваш кешбек (5-10%) нараховується автоматично та доступний для оплати до 50% вартості наступних послуг.';
      } else if (lower.includes('вартість') || lower.includes('цін') || lower.includes('прайс')) {
        botResponse = 'Ціни на послуги залежать від категорії майстера (Старший майстер, Топ-майстер, Експерт). Ви можете переглянути повний прайс у розділі «Послуги».';
      }
      setChatMessages((prev) => [...prev, { sender: 'bot', text: botResponse }]);
    }, 300);
  };

  const diagnosticScenarios = [
    {
      id: 'late',
      title: '⏳ Я запізнююся на візит',
      advice: 'Якщо запізнення становить менше 15 хвилин, майстер чекає на вас. При запізненні понад 15 хвилин зв’яжіться з адміністратором для коригування послуг.',
      actionLabel: 'Зателефонувати адміністратору',
      actionUrl: 'tel:+380443334455',
    },
    {
      id: 'reschedule',
      title: '🔄 Хочу перенести або скасувати запис',
      advice: 'Ви можете безкоштовно змінити час або скасувати запис у Кабінеті клієнта не пізніше ніж за 3 години до початку візиту.',
      actionLabel: 'Відкрити Мої візити',
      actionUrl: '/account/appointments',
    },
    {
      id: 'loyalty',
      title: '💎 Перевірка кешбеку та бонусів',
      advice: 'Ваш баланс бонусів автоматично накопичується з кожної послуги (від 5% до 10%). Бонусами можна сплатити до 50% вартості.',
      actionLabel: 'Перейти в кабінет',
      actionUrl: '/account',
    },
    {
      id: 'payment',
      title: '💳 Питання щодо оплати та чеків',
      advice: 'Ми приймаємо картки Visa/Mastercard, Apple Pay, Google Pay, а також криптовалюту та корпоративні безготівкові платежі.',
      actionLabel: 'Написати консьєржу',
      actionUrl: 'https://t.me/fade_support_bot',
    },
  ];

  const handleFaqVote = (faqId: string, vote: 'yes' | 'no') => {
    setFaqVotes((prev) => ({ ...prev, [faqId]: vote }));
  };

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesQuery =
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, selectedCategory]);

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.phone || !ticketForm.message) return;
    setTicketSubmitted(true);
  };

  const handleCopyPhone = () => {
    navigator.clipboard?.writeText('+380443334455');
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      {/* Hero Header */}
      <div className="text-center space-y-3 bg-surface-sunken p-8 rounded-[var(--radius-card)]">
        <h1 className="font-display text-3xl font-bold text-text-primary">Центр підтримки FADE</h1>
        <p className="text-text-muted max-w-xl mx-auto text-sm">
          Швидкі відповіді на популярні запитання, прямий зв’язок із консьєржем та екстрена допомога з бронями.
        </p>

        {/* Search Bar */}
        <div className="max-w-md mx-auto pt-4 space-y-2">
          <TextField
            id="faq-search"
            label="Пошук"
            placeholder="Пошук запитань (напр. запізнення, кешбек)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-base"
          />
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-text-muted pt-1">
            <span className="font-medium text-text-primary">Швидкий пошук:</span>
            {['скасування', 'запізнення', 'кешбек', 'оплата'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearchQuery(tag)}
                className="px-2 py-0.5 rounded-full bg-surface-base border border-line hover:text-text-primary transition-colors"
              >
                #{tag}
              </button>
            ))}
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-action-primary underline ml-1"
              >
                Скинути
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Quick Concierge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 flex flex-col justify-between space-y-4 bg-surface-base border border-line">
          <div>
            <Badge tone="success" className="mb-2">Онлайн 24/7</Badge>
            <h3 className="font-semibold text-h4 text-text-primary">Telegram-консьєрж</h3>
            <p className="text-xs text-text-muted mt-1">
              Миттєве вирішення питань щодо записів, підбору майстрів та підтримки в реальному часі.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => window.open('https://t.me/fade_support_bot', '_blank')}
            className="w-full"
          >
            Написати в Telegram
          </Button>
        </Card>

        <Card className="p-6 flex flex-col justify-between space-y-4 bg-surface-base border border-line">
          <div>
            <Badge tone="info" className="mb-2">Гаряча лінія</Badge>
            <h3 className="font-semibold text-h4 text-text-primary">Телефон підтримки</h3>
            <p className="text-xs text-text-muted mt-1">
              Дзвінки приймаються щодня з 09:00 до 21:00 для екстрених питань та скасування візитів.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => window.location.href = 'tel:+380443334455'}
              className="flex-1 text-xs"
            >
              +38 (044) 333-44-55
            </Button>
            <Button
              variant="ghost"
              onClick={handleCopyPhone}
              className="px-3 text-xs"
              title="Скопіювати номер"
            >
              {copiedPhone ? 'Скопійовано ✓' : 'Копіювати'}
            </Button>
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-between space-y-4 bg-surface-base border border-line">
          <div>
            <Badge tone="neutral" className="mb-2">VIP Клієнтам</Badge>
            <h3 className="font-semibold text-h4 text-text-primary">Персональний менеджер</h3>
            <p className="text-xs text-text-muted mt-1">
              Доступно для власників статусу FADE Black та VIP-карток.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => alert('Будь ласка, увійдіть у кабінет для зв’язку з персональним менеджером.')}
            className="w-full"
          >
            Зв’язатися з VIP
          </Button>
        </Card>
      </div>

      {/* Interactive Support Diagnostic Wizard */}
      <Card className="p-6 md:p-8 bg-surface-base border border-line space-y-4">
        <div className="space-y-1">
          <Badge tone="info" className="mb-1">Інтерактивний помічник</Badge>
          <h3 className="font-display text-xl font-bold text-text-primary">Експрес-діагностика та вирішення питань</h3>
          <p className="text-xs text-text-muted">
            Оберіть вашу ситуацію для отримання миттєвої інструкції та прямої дії:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {diagnosticScenarios.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => setDiagnosticScenario(diagnosticScenario === sc.id ? null : sc.id)}
              className={`p-4 rounded-[var(--radius-card)] border text-left transition-all flex flex-col justify-between gap-2 ${
                diagnosticScenario === sc.id
                  ? 'border-action-primary bg-surface-sunken ring-1 ring-action-primary'
                  : 'border-line hover:border-action-primary/50 bg-surface-base'
              }`}
            >
              <span className="font-semibold text-sm text-text-primary">{sc.title}</span>
              <span className="text-[11px] text-action-primary font-medium underline">
                {diagnosticScenario === sc.id ? 'Сховати поради ▲' : 'Вирішити ▼'}
              </span>
            </button>
          ))}
        </div>

        {diagnosticScenario ? (
          (() => {
            const current = diagnosticScenarios.find((s) => s.id === diagnosticScenario);
            if (!current) return null;
            return (
              <div className="p-4 rounded-lg bg-surface-sunken border border-accent/30 space-y-3">
                <p className="text-sm text-text-primary leading-relaxed">{current.advice}</p>
                <div>
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (current.actionUrl.startsWith('http') || current.actionUrl.startsWith('tel:')) {
                        window.open(current.actionUrl, '_blank');
                      } else {
                        window.location.href = current.actionUrl;
                      }
                    }}
                    className="text-xs"
                  >
                    {current.actionLabel} →
                  </Button>
                </div>
              </div>
            );
          })()
        ) : null}
      </Card>

      {/* AI Concierge Chat Simulator */}
      <Card className="p-6 md:p-8 bg-surface-base border border-line space-y-4">
        <div className="space-y-1">
          <Badge tone="success" className="mb-1">ШІ-Консьєрж 24/7</Badge>
          <h3 className="font-display text-xl font-bold text-text-primary">Миттєвий чат підтримки FADE</h3>
          <p className="text-xs text-text-muted">
            Поставте запитання нашому віртуальному асистенту або оберіть швидку тему нижче:
          </p>
        </div>

        {/* Chat message history box */}
        <div className="max-h-60 overflow-y-auto space-y-3 p-4 rounded-lg bg-surface-sunken border border-line">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-accent text-accent-fg'
                    : 'bg-surface-base border border-line text-text-primary'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Quick prompt pills */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-text-muted self-center font-medium">Швидкі теми:</span>
          {[
            'Як скасувати запис?',
            'Де мій кешбек?',
            'Яка вартість послуг?',
          ].map((promptText) => (
            <button
              key={promptText}
              type="button"
              onClick={() => handleSendChatMessage(promptText)}
              className="px-2.5 py-1 rounded-full bg-surface-sunken border border-line hover:border-action-primary text-text-primary transition-colors"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Chat input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendChatMessage();
          }}
          className="flex gap-2 pt-2"
        >
          <TextField
            id="ai-chat-input"
            label=""
            placeholder="Введіть ваше запитання..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 bg-surface-base"
          />
          <Button type="submit" variant="primary" className="self-end text-xs px-4 py-2.5">
            Надіслати
          </Button>
        </form>
      </Card>

      {/* Live Shop Status & Instant Callback Widget */}
      <Card className="p-6 md:p-8 bg-surface-base border border-line space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <Badge tone="success" className="mb-1">Live • Статус черги</Badge>
            <h3 className="font-display text-xl font-bold text-text-primary">Експрес-дзвінок адміністратору</h3>
            <p className="text-xs text-text-muted">
              Поточна завантаженість: <span className="text-success font-medium">вільні місця є (очікування &lt; 5 хв)</span>. Замовте швидкий дзвінок:
            </p>
          </div>
        </div>

        {callbackRequested ? (
          <AlertBanner tone="success" title="Запит на зворотний дзвінок прийнято!">
            Адміністратор зв’яжеться з вами за номером {callbackPhone} протягом 5 хвилин.
          </AlertBanner>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!callbackPhone.trim()) return;
              setCallbackRequested(true);
            }}
            className="flex flex-col sm:flex-row gap-2 pt-2"
          >
            <TextField
              id="instant-callback-phone"
              label=""
              placeholder="Введіть ваш телефон (+380...)"
              value={callbackPhone}
              onChange={(e) => setCallbackPhone(e.target.value)}
              className="flex-1 bg-surface-sunken"
            />
            <Button type="submit" variant="primary" className="text-xs px-6 py-2.5">
              Передзвонити мені 📞
            </Button>
          </form>
        )}
      </Card>

      {/* FAQ Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="font-display text-2xl font-bold text-text-primary">Популярні запитання (FAQ)</h2>
          
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Усі' },
              { id: 'booking', label: 'Записи та візити' },
              { id: 'service', label: 'Послуги' },
              { id: 'loyalty', label: 'Лояльність' },
              { id: 'payment', label: 'Оплата' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-button)] transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-accent text-accent-fg'
                    : 'bg-surface-sunken text-text-muted hover:text-text-primary'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {filteredFaqs.length === 0 ? (
          <EmptyState
            title="Нічого не знайдено"
            description="Спробуйте змінити пошуковий запит або категорію."
            action={
              <Button variant="secondary" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
                Схвалити фільтри
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map((faq) => (
              <Card key={faq.id} className="p-5 bg-surface-base border border-line space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-text-primary text-base">{faq.question}</h4>
                  <Badge tone="neutral" className="text-[10px] uppercase">
                    {faq.category}
                  </Badge>
                </div>
                <p className="text-sm text-text-muted leading-relaxed">{faq.answer}</p>
                <div className="pt-2 flex items-center justify-between text-xs text-text-muted border-t border-line/50">
                  <span>Чи була ця відповідь корисною?</span>
                  {faqVotes[faq.id] ? (
                    <span className="text-success font-medium">Дякуємо за відгук!</span>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleFaqVote(faq.id, 'yes')}
                        className="px-2 py-1 rounded bg-surface-sunken hover:bg-surface-base border border-line text-text-primary transition-colors"
                      >
                        👍 Так
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFaqVote(faq.id, 'no')}
                        className="px-2 py-1 rounded bg-surface-sunken hover:bg-surface-base border border-line text-text-primary transition-colors"
                      >
                        👎 Ні
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Support Ticket Tracker */}
      <Card className="p-6 md:p-8 bg-surface-base border border-line space-y-6">
        <div className="max-w-xl space-y-2">
          <Badge tone="info" className="mb-1">Моніторинг звернень</Badge>
          <h3 className="font-display text-xl font-bold text-text-primary">Перевірити статус звернення (Ticket Tracker)</h3>
          <p className="text-sm text-text-muted">
            Введіть номер вашого звернення (напр. TICK-1042) або номер телефону, щоб дізнатися поточний статус обробки.
          </p>
        </div>

        <form onSubmit={handleTrackTicket} className="flex flex-col sm:flex-row gap-3">
          <TextField
            id="ticket-tracker-input"
            label=""
            placeholder="Номер звернення або телефон (напр. TICK-1234)..."
            value={trackingCode}
            onChange={(e) => {
              setTrackingCode(e.target.value);
              setTrackingError(false);
            }}
            className="flex-1 bg-surface-sunken"
          />
          <Button type="submit" variant="primary" className="text-xs px-6 py-2.5">
            Перевірити статус 🔍
          </Button>
        </form>

        {trackingError && (
          <AlertBanner tone="error" title="Звернення не знайдено">
            Будь ласка, перевірте правильність номера звернення (формат TICK-XXXX) або зверніться до Telegram-консьєржа.
          </AlertBanner>
        )}

        {ticketStatusResult && (
          <div className="p-4 rounded-lg bg-surface-sunken border border-accent/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary text-sm">Звернення: {ticketStatusResult.id}</span>
              <Badge tone="success">{ticketStatusResult.statusText}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-muted">
              <div>Оновлено: <strong className="text-text-primary">{ticketStatusResult.updatedAt}</strong></div>
              <div>Відповідальний: <strong className="text-text-primary">{ticketStatusResult.assignee}</strong></div>
            </div>
            <p className="text-xs text-text-muted pt-1 border-t border-line/50">
              Ваш запит на контролі. Служба підтримки зв’яжеться з вами найближчим часом.
            </p>
          </div>
        )}
      </Card>

      {/* Submit Ticket / Urgent Inquiry Section */}
      <Card className="p-6 md:p-8 bg-surface-sunken border border-line space-y-6">
        <div className="max-w-xl space-y-2">
          <h3 className="font-display text-xl font-bold text-text-primary">Потрібна індивідуальна допомога?</h3>
          <p className="text-sm text-text-muted">
            Залиште своє звернення, і наша служба підтримки зв’яжеться з вами протягом 15 хвилин у робочий час.
          </p>
        </div>

        {ticketSubmitted ? (
          <AlertBanner tone="success" title="Звернення успішно надіслано!">
            Ми отримали ваш запит і невдовзі зателефонуємо на вказаний номер телефону. Дякуємо, що ви з FADE.
          </AlertBanner>
        ) : (
          <form onSubmit={handleTicketSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <TextField
                id="ticket-name"
                label="Ваше ім’я"
                placeholder="Введіть ваше ім’я"
                value={ticketForm.name}
                onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
              />
              <TextField
                id="ticket-phone"
                label="Номер телефону *"
                placeholder="+380 (XX) XXX-XX-XX"
                required
                value={ticketForm.phone}
                onChange={(e) => setTicketForm({ ...ticketForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-1">
                <label htmlFor="ticket-message" className="block text-xs font-medium text-text-primary mb-1">
                  Опишіть вашу ситуацію або питання *
                </label>
                <textarea
                  id="ticket-message"
                  rows={4}
                  required
                  placeholder="Опишіть вашу ситуацію або питання..."
                  className="w-full rounded-[var(--radius-input)] border border-line bg-surface-base p-3 text-sm font-text text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none"
                  value={ticketForm.message}
                  onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                />
              </div>
              <Button type="submit" variant="primary" className="w-full">
                Надіслати звернення
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* CSAT Support Satisfaction Rating Widget */}
      <Card className="p-6 md:p-8 bg-surface-base border border-line space-y-4">
        <div className="space-y-1">
          <Badge tone="success" className="mb-1">Контроль якості</Badge>
          <h3 className="font-display text-xl font-bold text-text-primary">Оцініть якість підтримки FADE</h3>
          <p className="text-xs text-text-muted">
            Нам важливо знати вашу думку. Як ви оцінюєте роботу служби підтримки та консьєрж-сервісу?
          </p>
        </div>

        {csatSubmitted ? (
          <AlertBanner tone="success" title="Дякуємо за вашу оцінку!">
            Ваш відгук та коментар успішно збережено. Це допомагає нам робити сервіс FADE досконалим.
          </AlertBanner>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCsatRating(star)}
                    className={`w-10 h-10 rounded-full border text-sm font-semibold transition-colors flex items-center justify-center ${
                      csatRating && csatRating >= star
                        ? 'bg-accent text-accent-fg border-action-primary'
                        : 'bg-surface-sunken border-line text-text-primary hover:border-action-primary'
                    }`}
                  >
                    {star}★
                  </button>
                ))}
              </div>
              <Button
                variant="primary"
                disabled={!csatRating}
                onClick={() => {
                  if (csatRating) setCsatSubmitted(true);
                }}
                className="text-xs px-6 py-2.5"
              >
                Надіслати відгук 🌟
              </Button>
            </div>
            {csatRating && csatRating <= 4 && (
              <div className="pt-2">
                <TextField
                  id="csat-feedback-text"
                  label="Що саме ми можемо покращити?"
                  placeholder="Розкажіть детальніше про ваш досвід..."
                  value={csatFeedbackText}
                  onChange={(e) => setCsatFeedbackText(e.target.value)}
                  className="bg-surface-sunken"
                />
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
