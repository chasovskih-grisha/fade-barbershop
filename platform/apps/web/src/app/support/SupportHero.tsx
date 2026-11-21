'use client';

import { TextField } from '@fade/ui';

const SEARCH_TAGS = ['скасування', 'запізнення', 'кешбек', 'оплата'];

interface SupportHeroProps {
  searchQuery: string;
  onSearch: (value: string) => void;
}

export function SupportHero({ searchQuery, onSearch }: SupportHeroProps) {
  return (
    <div className="text-center space-y-3 bg-surface-sunken p-8 rounded-[var(--radius-card)]">
      <h1 className="font-display text-3xl font-bold text-text-primary">Центр підтримки FADE</h1>
      <p className="text-text-muted max-w-xl mx-auto text-sm">
        Швидкі відповіді на популярні запитання, прямий зв’язок із консьєржем та екстрена допомога з
        бронями.
      </p>

      <div className="max-w-md mx-auto pt-4 space-y-2">
        <TextField
          id="faq-search"
          label="Пошук"
          placeholder="Пошук запитань (напр. запізнення, кешбек)..."
          value={searchQuery}
          onChange={(event) => onSearch(event.target.value)}
          className="w-full bg-surface-base"
        />
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-text-muted pt-1">
          <span className="font-medium text-text-primary">Швидкий пошук:</span>
          {SEARCH_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onSearch(tag)}
              className="px-2 py-0.5 rounded-full bg-surface-base border border-line hover:text-text-primary transition-colors"
            >
              #{tag}
            </button>
          ))}
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearch('')}
              className="text-action-primary underline ml-1"
            >
              Скинути
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
