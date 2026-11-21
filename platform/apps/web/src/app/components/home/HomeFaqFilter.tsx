'use client';

import { FAQ_CATEGORIES, type FaqFilter } from './home-faq-data';

interface HomeFaqFilterProps {
  searchQuery: string;
  selectedCategory: FaqFilter;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: FaqFilter) => void;
}

export function HomeFaqFilter({
  searchQuery,
  selectedCategory,
  onSearchChange,
  onCategoryChange,
}: HomeFaqFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="🔍 Пошук по запитаннях (наприклад: знижка, скасування, кешбек)..."
        aria-label="Пошук по запитаннях"
        className="flex-1 rounded-input border border-line bg-surface-raised px-4 py-2.5 text-sm text-fg focus:outline-none focus:border-accent shadow-sm"
      />
      <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        {FAQ_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
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
  );
}
