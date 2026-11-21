'use client';

import { FILTERS, type ReferralFilter } from './referral-model';

export default function ReferralFilters({
  filter,
  query,
  onFilter,
  onQuery,
}: {
  filter: ReferralFilter;
  query: string;
  onFilter: (filter: ReferralFilter) => void;
  onQuery: (query: string) => void;
}) {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            onClick={() => onFilter(option.value)}
            className={`rounded-pill px-3 py-1.5 text-body-sm font-medium ${
              filter === option.value
                ? 'bg-interactive text-fg'
                : 'bg-surface-raised text-fg-secondary'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="mb-4 mt-4">
        <input
          type="text"
          placeholder="Пошук за ім'ям або телефоном..."
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          className="w-full max-w-md rounded-input border border-border bg-surface px-3 py-2 text-fg"
        />
      </div>
    </>
  );
}
