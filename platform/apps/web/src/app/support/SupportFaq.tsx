'use client';

import { useMemo, useState } from 'react';
import { Button, EmptyState } from '@fade/ui';
import { FAQ_CATEGORIES, filterFaqs } from './support-data';
import { SupportFaqCard } from './SupportFaqCard';

interface SupportFaqProps {
  searchQuery: string;
  selectedCategory: string;
  onSearch: (value: string) => void;
  onCategory: (value: string) => void;
}

export function SupportFaq({
  searchQuery,
  selectedCategory,
  onSearch,
  onCategory,
}: SupportFaqProps) {
  const [votes, setVotes] = useState<Record<string, 'yes' | 'no'>>({});
  const faqs = useMemo(
    () => filterFaqs(searchQuery, selectedCategory),
    [searchQuery, selectedCategory]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="font-display text-2xl font-bold text-text-primary">
          Популярні запитання (FAQ)
        </h2>
        <div className="flex flex-wrap gap-2">
          {FAQ_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategory(category.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-button)] transition-colors ${
                selectedCategory === category.id
                  ? 'bg-accent text-accent-fg'
                  : 'bg-surface-sunken text-text-muted hover:text-text-primary'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {faqs.length === 0 ? (
        <EmptyState
          title="Нічого не знайдено"
          description="Спробуйте змінити пошуковий запит або категорію."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                onSearch('');
                onCategory('all');
              }}
              className="mt-2"
            >
              Схвалити фільтри
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <SupportFaqCard
              key={faq.id}
              faq={faq}
              voted={Boolean(votes[faq.id])}
              onVote={(vote) => setVotes((prev) => ({ ...prev, [faq.id]: vote }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
