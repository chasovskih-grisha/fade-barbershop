'use client';

import { useState } from 'react';
import { FAQ_ITEMS, type FaqFilter } from './home-faq-data';
import { HomeFaqChat } from './HomeFaqChat';
import { HomeFaqFilter } from './HomeFaqFilter';
import { HomeFaqCard } from './HomeFaqCard';

type FaqFeedback = Record<number, 'yes' | 'no'>;

export function HomeFAQ() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FaqFilter>('all');
  const [faqFeedback, setFaqFeedback] = useState<FaqFeedback>({});

  const filteredFaqs = FAQ_ITEMS.map((item, originalIdx) => ({ ...item, originalIdx })).filter(
    (item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const query = searchQuery.toLowerCase();
      return (
        matchesCategory &&
        (item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query))
      );
    }
  );

  const handleFeedback = (idx: number, value: 'yes' | 'no') => {
    setFaqFeedback((prev) => ({ ...prev, [idx]: value }));
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
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
            Все, що варто знати перед першим візитом до FADE. Ми на зв&apos;язку щодня з 9:00 до
            21:00.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <HomeFaqChat />
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

      <HomeFaqFilter
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        onSearchChange={setSearchQuery}
        onCategoryChange={setSelectedCategory}
      />

      {filteredFaqs.length === 0 ? (
        <div className="text-center py-12 bg-surface-raised border border-line rounded-[var(--radius-card)] flex flex-col items-center gap-3">
          <p className="text-fg-secondary">За вашим запитом нічого не знайдено.</p>
          <button onClick={resetFilters} className="text-xs font-semibold text-accent underline">
            Скинути фільтри
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFaqs.map((item) => (
            <HomeFaqCard
              key={item.originalIdx}
              item={item}
              originalIdx={item.originalIdx}
              feedback={faqFeedback[item.originalIdx]}
              onFeedback={handleFeedback}
            />
          ))}
        </div>
      )}
    </section>
  );
}
